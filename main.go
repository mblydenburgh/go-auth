package main

import (
	"crypto/rsa"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/golang-jwt/jwt"
)

var errorLogger = log.New(os.Stderr, "ERROR ", log.Llongfile)
var signKey *rsa.PrivateKey

func GenerateJwt(request events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	log.Println("Generating new jwt")
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.StandardClaims{
		ExpiresAt: time.Now().Add(time.Hour * 1).Unix(),
		Issuer:    "go-auth",
	})

	// Sign and get the complete encoded token as a string using the secret
	tokenString, err := token.SignedString(signKey)

	if err != nil {
		log.Printf("Error creating jwt: %v", err)
		return serverError(err)
	}

	log.Println(tokenString, err)

	return events.APIGatewayV2HTTPResponse{
		StatusCode: 200,
		Body:       tokenString,
	}, nil
}

func main() {
	lambda.Start(GenerateJwt)
}

func serverError(err error) (events.APIGatewayV2HTTPResponse, error) {
	log.Println(err.Error())

	return events.APIGatewayV2HTTPResponse{
		StatusCode: http.StatusInternalServerError,
		Body:       http.StatusText(http.StatusInternalServerError),
	}, nil
}

func clientError(status int) (events.APIGatewayV2HTTPResponse, error) {
	return events.APIGatewayV2HTTPResponse{
		StatusCode: status,
		Body:       http.StatusText(status),
	}, nil
}
