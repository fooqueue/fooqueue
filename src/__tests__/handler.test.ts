import FooQueue, { create_job_context, fooQueueHandler, type FQHandlerContext, type FQJobStatusBody, type FQRegister, type FQRequestBody } from '../client/index';

test(`It doesn't init with no arguments`, () => {
  expect(FooQueue).toThrowError("Invalid Fooqueue server URL");
});

test(`It doesn't init without a server URL`, () => {
  expect(() => {
    //@ts-expect-error
    FooQueue(undefined, 'string');
  }).toThrowError("Invalid Fooqueue server URL");
});

test(`It doesn't init without an API key`, () => {
  expect(() => {
    //@ts-expect-error
    FooQueue('string', undefined);
  }).toThrowError("Invalid Fooqueue API key");
});

test(`It should generate a function when initialized`, () => {
  const inittedFq = FooQueue('string', 'string');
  expect(inittedFq).toBeTruthy()
});

test(`It should have an update property`, () => {
  const context = create_job_context('string', 'string', 'string');
  expect(context).toHaveProperty('update');
})



