<?php

return [
    // path to the folder that stores MuNG documents
    "documents-path" => __DIR__ . "/documents",

    // path to the global audit log file
    "audit-log-path" => __DIR__ . "/documents/audit_log.txt",

    // users that have access to the server
    "users" => [
        [
            // human-readable name, used in access logs
            "name" => "Root",

            // token that acts as both an ID and a password
            // (generate a 16-chars random string somewhere)
            "token" => "123456789",
        ],
    ],

    // If true, PHP errors are written to "errors.log" file next to
    // the index.php file. If false, they are left at default.
    // This is useful for debugging when the server is being installed and
    // you don't have access to the logs from the PHP server.
    "forward-php-errors-to-file" => false,
];
