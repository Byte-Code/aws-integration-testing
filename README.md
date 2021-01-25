# `@byte-code/aws-integration-testing`

Support library to perform integration testing with AWS, uses [localstack](https://github.com/localstack/localstack) via Docker under the hood.

## Requirements

A running Docker!

## What is delagated to me?

You are responsible to put the **locastack** in the right state (like creating dynamoDB tables).
There ia PR on AWS Cdk that will enable the CDK to use localstack as a target for the deploy, in the future we could use that feature to put the architecture in the right state.

> Remember to do not run multiple test at the same time, each provider instance will spawn a container.

## Jest best practices

It is a good idea to split the execution of the integration tests from the unit ones. [jest-runner-groups](https://www.npmjs.com/package/jest-runner-groups) could help.

### Troubles in beforeEach and beforeAll

As jest is forked from jasmine it inherited a not so fun behavior: if anything in beforeEach or beforeAll fails jest will continue to run the tests.
The solution suggested seems to use process.exit to stop, we need to figure out a better way. In future releases of jest the runner will be jest-circus that will change this behavior.
We will see what todo to support jest-runner-groups and jest-circus
Remember to use the ``--runInBand`` option to avoid concurrent executions

```json

{
  "scripts": {
    "test": "jest --detectOpenHandles --group=-integration",
    "integration-test": "jest --runInBand --group=integration",
    "integration-test-debug": "node --inspect-brk ./node_modules/.bin/jest --detectOpenHandles --runInBand --group=integration"
  }
}

```

## Usage

The following example reuse the same container for all the test to avoid spending a lot of time on recreating everything. Be aware that you need to avoid any dependency between the different test functions.

```typescript

/**
 * This is an integration tests, needs docker to run
 * 
 * @group integration/a-nice-group
 */

import { LocalStackProvider } from '@byte-code/aws-integration-testing';
import { APIGateway } from 'aws-sdk';

describe('My Great Test', () => {

  // our class under test
  let theThingWeWantToTest: ClassUnderTest;

  const localStackProvider: LocalStackProvider = new LocalStackProvider(['apigateway']);

  beforeAll(async () => {
    const result = await localStackProvider.startEndpoint()

    const baseAWSConf = {
      endpoint: result.awsEndpoint,
      region: 'us-west-1',
      accessKeyId: 'local',
      secretAccessKey: 'local',
    };

    // We need to inject aws services configured with custom enpoint, 
    // the endpoint is always the same
    theThingWeWantToTest = new ClassUnderTest(
            new APIGateway(
              { ... baseAWSConf }
            )
          );
  })

  it('this test do something great', () => {
    // do whathever you need with theThingWeWantToTest
  })

  afterAll(async () => {
    await localStackProvider.stop();
  })
})
```
