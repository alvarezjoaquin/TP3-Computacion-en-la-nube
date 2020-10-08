var AWS = require('aws-sdk');
const shortid = require('shortid'); // generador de id

// con callback
// var handler = (event, callback) => {

var handler = async(event, request) => {
    var dynamodb = new AWS.DynamoDB({
        apiVersion: '2012-08-10',
        endpoint: 'http://dynamodb:8000',
        region: 'us-west-2',
        credentials: {
            accessKeyId: '2345',
            secretAccessKey: '2345'
        }
    });

    var docClient = new AWS.DynamoDB.DocumentClient({
        apiVersion: '2012-08-10',
        service: dynamodb
    });

    //Crear envio
    if (event.httpMethod == "POST") {

        var json = JSON.parse(event.body);

        let fechaActualNew = new Date().toISOString();
        let idNew = shortid.generate(); // genero id       

        let destinoNew = json.destino;
        let emailNew = json.email;

        //Paso parametros al envio a crear
        var params = {
            RequestItems: { // A map of TableName to Put or Delete requests for that table
                Envio: [ // a list of Put or Delete requests for that table
                    { // An example PutRequest
                        PutRequest: {
                            Item: {
                                id: idNew,
                                destino: destinoNew,
                                fechaAlta: fechaActualNew,
                                pendiente: fechaActualNew,
                                email: emailNew,
                            } // a map of attribute name to AttributeValue    

                        }
                    },
                ],
                // ... more tables ...
            },
            ReturnConsumedCapacity: 'NONE', // optional (NONE | TOTAL | INDEXES)
            ReturnItemCollectionMetrics: 'NONE', // optional (NONE | SIZE)
        };
        var error;
        var datos;
        return docClient.batchWrite(params, function(err, data) {
                if (err) error = err; // an error occurred
                else datos = data; // successful response
            }).promise()
            .then(datos => {
                return {
                    statusCode: 200,
                    body: JSON.stringify(datos)
                };
            })
            .catch(error => {
                console.log(error);

                return {
                    statusCode: 500,
                    body: err.message
                };
            });
    }

    //Listar envios pendientes
    if (event.httpMethod == "GET") {

        var params = {
            TableName: 'Envio',
            IndexName: 'EnviosPendientesss',
            KeyConditionExpression: 'pendiente = :pendiente',
            ExpressionAttributeValues: {
                ':pendiente': 'S',
            },
            ScanIndexForward: false
        };
        var error;
        var datos;
        return docClient.query(params, function(err, data) {
                if (err) error = err; // an error occurred
                else datos = data; // successful response
            }).promise()
            .then(datos => {
                return {
                    statusCode: 200,
                    body: JSON.stringify(datos)
                };
            })
            .catch(err => {
                console.log(error);

                return {
                    statusCode: 500,
                    body: err.message
                };

            });
    }

    // //Actualizar envio a entregado
    if (event.httpMethod == "PUT") {

        var json = JSON.parse(event.body);
        let fecha = json.fechaAlta;
        let idEnv = (event.pathParameters).idEnvio;

        var params = {
            ExpressionAttributeNames: { // a map of substitutions for attribute names with special characters
                "#pendi": "pendiente",
            },
            ExpressionAttributeValues: { // a map of substitutions for all attribute values
                ":pen": {
                    S: " ",
                },
            },
            Key: {

                "id": {
                    S: idEnv // lo obtengo de la URL
                },

                "fechaAlta": {
                    S: fecha //lo obtengo del body del request
                }

            },
            ReturnValues: 'ALL_NEW',
            TableName: 'Envio',
            UpdateExpression: "SET #pendi = :pen", // String representation of the update to an attribute

        };
        var error;
        var datos;
        return dynamodb.updateItem(params, function(err, data) {
                if (err) error = err; // an error occurred
                else datos = data; // successful response
            }).promise()
            .then(datos => {
                return {
                    statusCode: 200,
                    body: JSON.stringify(datos)
                };
            })
            .catch(err => {
                console.log(error);

                return {
                    statusCode: 500,
                    body: err.message
                };

            });

    }


    // con callback
    // dynamodb.listTables((err, data) => {
    //     console.log(data);

    //     callback(null, { statusCode: 200 });
    // });

}

exports.handler = handler;