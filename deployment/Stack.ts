import cdk = require('@aws-cdk/core');
import { Code, Function, Runtime } from "@aws-cdk/aws-lambda"
import { ManagedPolicy, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { CorsHttpMethod, HttpApi, HttpMethod } from "@aws-cdk/aws-apigatewayv2"
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations"

export class CdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const appName = "go-auth-test"

        const lambdaRole = new Role(this, `LambdaRole`, {
            roleName: `${appName}-role`,
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        })

        const lambdaFunction = new Function(this, `LambdaFunction`, {
            functionName: `${appName}-lambda`,
            runtime: Runtime.GO_1_X,
            role: lambdaRole,
            code: Code.fromAsset("../bin/main.zip"),
            handler: "main"
        })
        lambdaFunction.grantInvoke(new ServicePrincipal("apigateway.amazonaws.com"))

        const lambdaIntegration = new HttpLambdaIntegration("HttpLambdaIntegration", lambdaFunction)

        const api = new HttpApi(this, `RestAPIGateway`, {
            apiName: "auth-api",
            corsPreflight: {
                allowHeaders: ['Authorization', 'Access-Control-Allow-Origin','Access-Control-Allow-Headers','Content-Type',"X-Api-Key","X-Amz-Security-Token"],
                allowMethods: [
                    CorsHttpMethod.ANY
                ],
                allowOrigins: ['*'],
            },
        })

        api.addRoutes({
            path: "/jwt",
            methods: [HttpMethod.ANY],
            integration: lambdaIntegration
        })
        
        api.addRoutes({
            path: "/jwt/{proxy+}",
            methods: [HttpMethod.ANY],
            integration: lambdaIntegration
        })
    }
}
