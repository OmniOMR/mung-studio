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

> **Note:** This command automatically skips files that are owned by the www user.

If you have the `documents` folder exposed by the web server and you would like to hide its contents, you can add an `.htaccess` file there with this content:

```
Deny from all
```


## Client integration

When building the client webapp via `npm run build`, you must configure the simple PHP backend endpoint in the `.env` file:

```bash
SIMPLE_PHP_BACKEND_URL=http://localhost:8080
```


## Authentication

Only authenticated users can access the backend. These are configured in the `config.php` file in the `"users"` array. Each needs to have a `name` and a `token` specified:

```php
"users" => [
    [
        "name" => "Root",
        "token" => "123456789",
    ]
]
```

For the token, generate a 16-character long random string. It acts as both an identifier and a password for the user. Send this password to the user, for example, via email. The user name is used in the access logs to make them human readable and it's also displayed to the user after they provide their token to the MuNG Studio frontend (it gets stored in the local storage of their web browser).


## Documents folder structure

The annotated documents folder has this structure:

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
    audit_log.txt
```

It contains one folder for each annotated document and the name of the folder is used to identify the document. It can only contain alphanumeric characters, underscores and hyphens (regex `[a-zA-Z0-9_-]+`).

Inside each folder, there is the `image.jpg` file and `mung.xml` file. These two are the only needed files for a new document - all other files are created and managed by the backend code.

> **Note:** To add custom documents for annotation, see the section below.

Whenever the document is written, the today's `backups/{date}.xml` file gets created/updated. This way you can recover from accidents, just copy the proper backup file and overwrite the `mung.xml` file with it.

The `thumbnail.jpg` is created when the thumbnail is requested (the `get-document-thumbnail` action), however the PHP runtime needs to have the GD image extension installed and enabled.

The `access_log.txt` contains all the READ and WRITE operations, when they occured and who made them. The `write_log.txt` contains only the WRITE operations. Both these logs are scoped to the document.

Finally, there's the top-level `audit_log.txt` file in the top-level folder, which contains all READ and WRITE operations for all documents in one place. It provides a chronological overview of entire backend activity.


## Creating a new document to be annotated

First, create a folder in the `documents` folder with the name of the new document. Make sure to fulfill the naming constraints (regex `[a-zA-Z0-9_-]+`) otherwise the folder will be ignored by the PHP backend code.

```bash
~/spb/documents$ mkdir my_test_document
```

Inside of this folder, put the image file and the initial MuNG file:

```bash
# in ~/spb/documents/my_test_document$
mv {image_path} image.jpg
mv {mung_path} mung.xml
```

You can use an empty MuNG file with this content, just modify the dataset metadata:

```xml
<?xml version="1.0" encoding="utf-8"?>
<Nodes
    dataset="my_dataset"
    document="0001.jpg"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="CVC-MUSCIMA_Schema.xsd"
></Nodes>
```

You can now add multiple documents in this way.

Finally, go back to the backend server folder and recursively set readable permissions to the created files, so that the WWW user can read and modify them:

```bash
# in ~/spb$
chmod -R a=rwX documents
```

> **Note:** This command automatically skips files that are owned by the www user.


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


### `/?action=whoami` Who am I

```bash
curl -v -X POST -H "Authorization: Bearer 123456789" \
    localhost:8080/?action=whoami
```

Request has no body, response contains information about the authenticated user:

```json
{
    "name": "John Doe"
}
```


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
        -H "Content-Type: application/mung+xml" \
        -H "Authorization: Bearer 123456789" \
        "localhost:8080/?action=upload-document-mung&document=docname"
```

Request body has the MuNG file XML content. The URL must contain the `document` parameter with the uploaded document name. The response is 200 OK and empty body.
