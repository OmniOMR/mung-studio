# Simple PHP backend

MuNG studio is intended to be easy to install and use. It can run completely client-side, requiring only a static web server for hosting its assets file. However in practise, manually uploading and downloading files to the browser is tedious. For this reason, MuNG Studio also provides a simple PHP backend, that can be used for simple annotation endevaours and can be hosted on any plain PHP web hosting.

This simple backend is implemented in the `simple-php-backend` folder in the root of this repository.


## Server installation

The backend server consists of two files:

- `index.php` Contains the entire backend server.
- `config.php` Contains configuration that must modify.

To install the server, simply copy these two files into any PHP-running web hosting, into a folder of your choosing, and modify the config file properly.

When debugging the deployment, you can enable PHP errors forwarding into a log file in the config:

```php
// config.php

return [
    // ...

    "forward-php-errors-to-file" => true,
];
```

And also, to make sure the script has rights to write to that log file, it's better that you create it manually and set its rights so that anyone can write to it:

```bash
touch errors.log
chmod 666 errors.log
```

Also, create the documents folder and make sure it's writable by the web server:

```bash
mkdir documents
chmod 777 documents
```

If you copy files into documents yourself, you can set their permissions this way:

```bash
chmod -R a=rwX documents
```

> **Note:** This automatically skips files that are owned by the www user.

If you have the `docuemnts` folder exposed by the web server and you would like to hide its contents, you can add an `.htaccess` file there with this content:

```
Deny from all
```


## Client integration

TODO

(what env variables to set for parcel to include a reference in the studio's home page)


## Authentication

TODO

List users (annotators) in the config file.


## Documents folder structure

TODO

```
documents/
    name-of-a-document/
        backups/
            2025-04-05.xml
            2025-04-06.xml
            2025-04-12.xml
        mung.xml
        image.jpg
        thumbnail.jpg
        access_log.txt
        write_log.txt
```


## Development

Run php development server from inside the `simple-php-backend` folder and send requests via `curl` or via a properly set up client.

```bash
php -S localhost:8080
```


## Server HTTP API

Unauthenticated requests are not allowed.

Users are authenticated via the HTTP `Authorization` header via the bearer token:

```
Authorization: Bearer 1234567890
```

All requests are sent as POST requests to the `index.php` file, with a URL query parameter `action` specifying the action that is to be taken.

```
localhost:8080/?action=list-documents
```

The rest (body present, and its content type and strucure) depends on the chosen action:


### `/?action=list-documents` List documents

```bash
curl -v -X POST -H "Authorization: Bearer 123456789" \
    localhost:8080/?action=list-documents
```

Request has no body, response contains all documents on the server:

```json
{
    "documents": [
        {
            "name": "foobar",
            "hasImage": true,
            "modifiedAt": "2024-10-07T14:23:54Z"
        }
    ]
}
```


### `/?action=get-document-mung&document=docname` Get document MuNG file

```bash
curl -v -X POST -H "Authorization: Bearer 123456789" \
    "localhost:8080/?action=get-document-mung&document=docname"
```

Request has no body, the URL must contain the `document` parameter with the requested document name. The response contains the MuNG XML file.


### `/?action=get-document-image&document=docname` Get document image file

```bash
curl -v -X POST -H "Authorization: Bearer 123456789" \
    "localhost:8080/?action=get-document-image&document=docname"
```

Request has no body, the URL must contain the `document` parameter with the requested document name. The response contains the JPEG file.


### `/?action=get-document-thumbnail&document=docname` Get document thumbnail file

```bash
curl -v -X POST -H "Authorization: Bearer 123456789" \
    "localhost:8080/?action=get-document-thumbnail&document=docname"
```

Request has no body, the URL must contain the `document` parameter with the requested document name. The response contains the JPEG file.


### `/?action=upload-document-mung&document=docname` Upload updated document MuNG file

```bash
    curl -v -X POST --data-binary "@docname.xml" \
        -H "Content-Type: applicaiton/mung+xml" \
        -H "Authorization: Bearer 123456789" \
        "localhost:8080/?action=upload-document-mung&document=docname"
```

Request body has the MuNG file XML content. The URL must contain the `document` parameter with the uploaded document name. The response is 200 OK and empty body.
