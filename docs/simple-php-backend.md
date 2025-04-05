# Simple PHP backend

MuNG studio is intended to be easy to install and use. It can run completely client-side, requiring only a static web server for hosting its assets file. However in practise, manually uploading and downloading files to the browser is tedious. For this reason, MuNG Studio also provides a simple PHP backend, that can be used for simple annotation endevaours and can be hosted on any plain PHP web hosting.

This simple backend is implemented in the `simple-php-backend` folder in the root of this repository.


## Server installation

The backend server consists of two files:

- `index.php` Contains the entire backend server.
- `config.php` Contains configuration that you can modify.

To install the server, simply copy these two files into any PHP-running web hosting, into a folder of your choosing.


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
    slug-name-of-a-document/
        old_versions/
            2025-04-05.xml
            2025-04-06.xml
            2025-04-12.xml
        mung.xml
        image.jpg
        thumbnail.jpg
        access_log.txt
        write_log.txt
```


## Server HTTP API

TODO

- fetch list of all documents
- fetch a particular document (mung / image / thumbnail)
- upload a new version of a document


## Development

Run php development server from inside the `simple-php-backend` folder and send requests via `curl` or via a properly set up client.

```bash
php -S localhost:8080
```
