const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../controllers/seatReservationController.js'), 'utf8');
const morning = '08:00 AM \u2013 10:00 AM';
const lateMorning = '10:00 AM \u2013 12:00 PM';
const afternoon = '12:00 PM \u2013 02:00 PM';

// Run the real controller with a fixed instant and in-memory model doubles.
// No test connects to MongoDB or consumes a viva account/seat.
function controllerAt(instant, existing = [], options = {}) {
  const writes = [];
  let inserts = 0;
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [instant])); }
  }
  const reservationModel = {
    init: async () => {},
    find: async (filter) => [...existing, ...writes].filter((record) =>
      Object.entries(filter).every(([key, value]) =>
        key === 'time' ? value.$in.includes(record.time) : record[key] === value
      )
    ),
    create: async (record) => {
      inserts += 1;
      if (options.failOnInsert === inserts) throw options.insertError;
      const saved = { ...record, _id: String(inserts).padStart(24, '0') };
      writes.push(saved);
      return saved;
    },
    deleteMany: async (filter) => {
      for (let index = writes.length - 1; index >= 0; index -= 1) {
        if (filter._id.$in.includes(writes[index]._id)) writes.splice(index, 1);
      }
    },
  };
  const context = {
    Date: FixedDate, Intl, process: { env: {} }, console,
    module: { exports: {} },
    require: (name) => {
      if (name === 'mongoose') return { isValidObjectId: () => true };
      if (name === '../models/SeatReservation') return reservationModel;
      if (name === '../models/ReadingRoom') return {
        findById: async () => ({ status: 'active', totalSeats: 24, openingTime: '08:00', closingTime: '18:00' }),
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  };
  vm.runInNewContext(source, context);
  return { controller: context.module.exports, writes };
}

async function book(instant, date, blocks, options = {}) {
  const { controller, writes } = controllerAt(instant, options.existing, options.modelOptions);
  let status;
  let body;
  const res = { status(value) { status = value; return this; }, json(value) { body = value; return this; } };
  const batch = Array.isArray(blocks);
  const req = { body: { readingRoom: '0123456789abcdef01234567', studentId: 'test-student', seatNumber: 1, date, ...(batch ? { blocks } : { time: blocks }), ...options.overrides } };
  await controller[batch ? 'createReservationBatch' : 'createReservation'](req, res);
  return { status, body, writes };
}

test('at 11:07 Sri Lankan time, both earlier blocks are rejected without writes', async () => {
  for (const block of [morning, lateMorning]) {
    const result = await book('2026-10-11T05:37:00Z', '2026-10-11', block);
    assert.equal(result.status, 400);
    assert.match(result.body.message, /already started/);
    assert.equal(result.writes.length, 0);
  }
});

test('a batch containing an expired block is rejected completely', async () => {
  const result = await book('2026-10-11T05:37:00Z', '2026-10-11', [lateMorning, afternoon]);
  assert.equal(result.status, 400);
  assert.equal(result.writes.length, 0);
});

test('a later block today is allowed and retains its en-dash string', async () => {
  const result = await book('2026-10-11T05:37:00Z', '2026-10-11', afternoon);
  assert.equal(result.status, 201);
  assert.equal(result.writes[0].time, afternoon);
});

test('an 08:00 block tomorrow remains bookable', async () => {
  const result = await book('2026-10-11T05:37:00Z', '2026-10-12', morning);
  assert.equal(result.status, 201);
});

test('start boundary: 07:59:59 allowed; exactly 08:00 rejected', async () => {
  assert.equal((await book('2026-10-11T02:29:59Z', '2026-10-11', morning)).status, 201);
  assert.equal((await book('2026-10-11T02:30:00Z', '2026-10-11', morning)).status, 400);
});

test('Sri Lankan midnight rejects yesterday even while UTC is still yesterday', async () => {
  const result = await book('2026-10-11T18:30:00Z', '2026-10-11', afternoon);
  assert.equal(result.status, 400);
  assert.match(result.body.message, /past/);
  assert.equal(result.writes.length, 0);
});

test('after Sri Lankan midnight, the new day morning is allowed', async () => {
  assert.equal((await book('2026-10-11T18:30:00Z', '2026-10-12', morning)).status, 201);
});

test('future batch works while the existing en-dash contract stays enforced', async () => {
  assert.equal((await book('2026-10-11T05:37:00Z', '2026-10-12', [morning, lateMorning])).writes.length, 2);
  assert.equal((await book('2026-10-11T05:37:00Z', '2026-10-12', morning.replace('\u2013', '-'))).status, 400);
});

const existingBooking = {
  studentId: 'test-student', date: '2026-10-12', status: 'active',
  readingRoom: '1123456789abcdef01234567', seatNumber: 2, time: morning,
};
const testNow = '2026-10-11T05:37:00Z';

test('same person cannot book the same time in another room', async () => {
  const result = await book(testNow, '2026-10-12', morning, { existing: [existingBooking] });
  assert.equal(result.status, 409);
  assert.equal(result.body.code, 'STUDENT_TIME_CONFLICT');
  assert.equal(result.writes.length, 0);
});

test('same person cannot book another seat in the same room/time', async () => {
  const result = await book(testNow, '2026-10-12', morning, {
    existing: [existingBooking], overrides: { readingRoom: existingBooking.readingRoom },
  });
  assert.equal(result.status, 409);
  assert.equal(result.writes.length, 0);
});

test('different room block offsets are checked for partial overlap', async () => {
  const result = await book(testNow, '2026-10-12', morning, {
    existing: [{ ...existingBooking, time: '09:00 AM \u2013 11:00 AM' }],
  });
  assert.equal(result.status, 409);
});

test('one conflicting block rejects an entire new batch', async () => {
  const result = await book(testNow, '2026-10-12', [morning, lateMorning], {
    existing: [{ ...existingBooking, time: lateMorning }],
  });
  assert.equal(result.status, 409);
  assert.equal(result.writes.length, 0);
});

test('adjacent bookings that touch at 10:00 are allowed', async () => {
  const result = await book(testNow, '2026-10-12', lateMorning, { existing: [existingBooking] });
  assert.equal(result.status, 201);
  assert.equal(result.writes[0].occupiedMinutes[0], 600);
  assert.equal(result.writes[0].occupiedMinutes.at(-1), 719);
});

test('cancelled bookings, other dates and other people do not block signup owner', async () => {
  for (const change of [{ status: 'cancelled' }, { date: '2026-10-13' }, { studentId: 'another-student' }]) {
    assert.equal((await book(testNow, '2026-10-12', morning, {
      existing: [{ ...existingBooking, ...change }],
    })).status, 201);
  }
});

test('academic staff identity receives the same overlap protection', async () => {
  const result = await book(testNow, '2026-10-12', morning, {
    overrides: { studentId: 'AC010' }, existing: [{ ...existingBooking, studentId: 'AC010' }],
  });
  assert.equal(result.status, 409);
});

test('another person still cannot take an already reserved seat', async () => {
  const result = await book(testNow, '2026-10-12', morning, {
    existing: [{ ...existingBooking, studentId: 'another-student' }],
    overrides: { readingRoom: existingBooking.readingRoom, seatNumber: existingBooking.seatNumber },
  });
  assert.equal(result.status, 409);
  assert.match(result.body.message, /seat is no longer available/);
  assert.equal(result.writes.length, 0);
});

test('database overlap race returns the same clear conflict response', async () => {
  const result = await book(testNow, '2026-10-12', morning, {
    modelOptions: { failOnInsert: 1, insertError: { code: 11000, keyPattern: { occupiedMinutes: 1 } } },
  });
  assert.equal(result.status, 409);
  assert.equal(result.body.code, 'STUDENT_TIME_CONFLICT');
  assert.equal(result.writes.length, 0);
});

test('a batch database race rolls back its earlier successful insert', async () => {
  const result = await book(testNow, '2026-10-12', [morning, lateMorning], {
    modelOptions: { failOnInsert: 2, insertError: { code: 11000, keyPattern: { occupiedMinutes: 1 } } },
  });
  assert.equal(result.status, 409);
  assert.equal(result.body.code, 'STUDENT_TIME_CONFLICT');
  assert.equal(result.writes.length, 0);
});
