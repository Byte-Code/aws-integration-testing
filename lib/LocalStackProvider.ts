import { GenericContainer, Wait, StartedTestContainer } from "testcontainers";
import { v4 as uuidv4 } from 'uuid';

export class LocalStackProvider {

  private localStackContainer: StartedTestContainer;

  /**
   * Create a new instance with the configured enabledAwsServices, needs to be started using the 
   * `startEndpoint` method and sopped using `stop`. For string to use for services @see https://docs.aws.amazon.com/cli/latest/reference/#available-services
   * Remember that this use the open version of `localstack` so not all services are available
   * 
   * @param enabledAwsServices an array with the enabled services  
   */

  constructor(readonly enabledAwsServices: string[]) {    
  }

  /**
   * Starts the localstack container with the configured `enabledServices`
   * 
   * @returns `awsEndPoint` the end point to use in the aws-sdk clients
   */

  public async startEndpoint() : Promise<{ awsEndpoint: string }> {

    const createEndpointIfNeeded = async (): Promise<{ awsEndpoint: string }> => {

      const injectedLocalStackEndpointUrl = process.env ? process.env['LOCALSTACK_AWS_ENDPOINT_URL']: undefined;
      if (injectedLocalStackEndpointUrl) {
        return { awsEndpoint: injectedLocalStackEndpointUrl}
      }

      console.info('starting localstack container');

      const containerName = `LocalStack-Integration-${uuidv4()}`;
      this.localStackContainer = await new GenericContainer("localstack/localstack")
        .withName(containerName)
        .withExposedPorts(4566)
        .withEnv("SERVICES", this.enabledAwsServices.join(','))
        .withWaitStrategy(Wait.forLogMessage('Ready.'))
        .start();

        console.info(`localstack container with name ${containerName}`);

      const ipAddress = this.localStackContainer.getContainerIpAddress();
      const exposedPort = this.localStackContainer.getMappedPort(4566);
      const awsEndpoint = `http://${ipAddress}:${exposedPort}`;

      console.info('localstack container endpoint url ', {awsEndpoint});

      return { awsEndpoint };
    }

    try {
              
      const { awsEndpoint } = await createEndpointIfNeeded();
  
      return {
        awsEndpoint,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
    
  }

  /**
  * Stops the localstack instance and remove the container instance
  */

  public async stop() {
    if (this.localStackContainer === undefined) {
      console.info('localstack container was not running, nothing todo');
      return true;
    }

    console.info('stopping localstack container');
    await this.localStackContainer.stop();    
    return true;
  }


}