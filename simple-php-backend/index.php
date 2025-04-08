<?php

// load config
$CONFIG = require_once __DIR__ . "/config.php";

// forward error logs if requested
if ($CONFIG["forward-php-errors-to-file"] === true) {
    ini_set("log_errors", 1);
    ini_set("error_log", __DIR__ . "/errors.log");
}

// operate in the UTC timezone
date_default_timezone_set("UTC");


////////////////////
// Authentication //
////////////////////

class User {
    
    /**
     * Human-readable name, used in access logs
     */
    public string $name;

    /**
     * Token that acts as both an ID and a password.
     * Sent with each request to authenticate the user.
     */
    public string $token;
    
    /**
     * Parses out a user from the config record
     */
    public static function parse(array $data) {
        if (!array_key_exists("name", $data)) {
            throw new Exception("User data is missing the 'name' field.");
        }
        if (!array_key_exists("token", $data)) {
            throw new Exception("User data is missing the 'token' field.");
        }

        $name = (string) $data["name"];
        $token = (string) $data["token"];
        
        $u = new User();
        $u->name = $name;
        $u->token = $token;
        return $u;
    }
}

/**
 * Loads all User instances from config and returns them in an array
 */
function load_all_users(): array {
    global $CONFIG;

    if (!array_key_exists("users", $CONFIG)) {
        return [];
    }

    $configUsers = $CONFIG["users"] or [];

    if (!is_array($configUsers)) {
        return [];
    }

    $users = [];

    foreach ($configUsers as $u) {
        $users[] = User::parse($u);
    }

    return $users;
}

/**
 * Parses out the sent bearer token. If the token was not sent
 * or cannot be parsed, null is returned.
 */
function parse_bearer_token(): string | null {
    $headers = getallheaders(); // array: ["header" => "value"]

    if (!array_key_exists("Authorization", $headers)) {
        return null;
    }

    $value = $headers["Authorization"];

    $prefix = "Bearer ";

    if (mb_substr($value, 0, mb_strlen($prefix)) !== $prefix) {
        return null;
    }

    $token = trim(mb_substr($value, mb_strlen($prefix)));

    if (mb_strlen($token) == 0) {
        return null;
    }

    return $token;
}

/**
 * Sends HTTP response with the 401 Unauthenticated content.
 * Kills the script.
 */
function fail_unauthenticated() {
    http_response_code(401);
    echo "Unauthenticated.\n";
    exit;
}

/**
 * Resolves the user that sent the request.
 * Kills the script if authentication fails.
 */
function authenticate_and_get_user(): User {
    $sentToken = parse_bearer_token();

    if ($sentToken === null) {
        fail_unauthenticated();
        exit;
    }
    
    $users = load_all_users();

    foreach ($users as $user) {
        if ($user->token === $sentToken) {
            return $user;
        }
    }

    fail_unauthenticated();
    exit;
}


///////////////
// Documents //
///////////////

class Document {

    /**
     * Name of the document
     * (acts like an ID and must be [a-zA-Z0-9_-] because it aligns
     * with the folder name in the filesystem)
     */
    public string $name;

    /**
     * Is the background image provided for this document
     */
    public bool $hasImage;

    /**
     * When was the file last modified, in ISO Zulu time
     */
    public string $modifiedAt;

    public function to_json(): array {
        return [
            "name" => $this->name,
            "hasImage" => $this->hasImage,
            "modifiedAt" => $this->modifiedAt,
        ];
    }

    /**
     * Returns path to the documents folder
     */
    public static function documents_folder_path(): string {
        global $CONFIG;
        return (string) $CONFIG["documents-path"];
    }

    /**
     * Runs checks for existance and writability of the documents folder
     */
    public static function verify_documents_folder() {
        $path = static::documents_folder_path();

        if (mb_substr($path, mb_strlen($path) - 1) === "/") {
            throw new Exception(
                "Documents folder path must not end with slash."
            );
        }

        if (!is_dir($path)) {
            throw new Exception("Documents folder does not exist.");
        }

        if (!is_writable($path)) {
            throw new Exception("Documents folder is not writable.");
        }
    }

    /**
     * Tries loading a document from the filesystem.
     * If it doesn't exist, or is missing the MuNG file, null is returned.
     */
    public static function try_load(string $name): Document | null {
        $path = static::documents_folder_path() . "/" . $name;

        if (!is_dir($path)) {
            return null;
        }

        if (!is_file($path . "/mung.xml")) {
            return null;
        }

        $hasImage = is_file($path . "/image.jpg");
        $modifiedAt = date("Y-m-d\TH:i:s\Z", filemtime($path . "/mung.xml"));

        $d = new Document();
        $d->name = $name;
        $d->hasImage = $hasImage;
        $d->modifiedAt = $modifiedAt;
        return $d;
    }

    /**
     * Loads all documents from the filesystem
     * (metada only)
     */
    public static function load_all(): array {
        $documents_path = static::documents_folder_path();
        $items = scandir($documents_path);
        $documents = [];

        foreach ($items as $item) {
            if ($item == "." || $item == "..") {
                continue;
            }
            
            if (is_dir($documents_path . "/" . $item)) {
                $d = static::try_load($item);
                if ($d !== null) {
                    $documents[] = $d;
                }
            }
        }

        return $documents;
    }
}


/////////////
// Actions //
/////////////

/**
 * Lists all MuNG documents on the server
 */
function action_list_documents() {
    $user = authenticate_and_get_user();

    $documents = Document::load_all();

    $jsonDocuments = [];
    foreach ($documents as $document) {
        $jsonDocuments[] = $document->to_json();
    }

    header("Content-Type: application/json; charset=utf-8");
    echo json_encode([
        "documents" => $jsonDocuments
    ], JSON_PRETTY_PRINT);
}

/**
 * Returns the latest MuNG file for a document
 */
function action_get_document_mung() {
    $user = authenticate_and_get_user();

    //
}

/**
 * Returns the image for a document
 */
function action_get_document_image() {
    $user = authenticate_and_get_user();

    //
}

/**
 * Returns the thumbnail image for a document
 */
function action_get_document_thumbnail() {
    $user = authenticate_and_get_user();

    //
}

/**
 * Accepts an updated version of a MuNG document
 */
function action_upload_document_mung() {
    $user = authenticate_and_get_user();

    //
}


////////////
// Router //
////////////

/**
 * The routing function itself
 */
function run_router_and_call_proper_action() {
    $action = $_GET["action"]; // string or null

    switch ($action) {
        case "list-documents":
            action_list_documents();
            break;
        
        case "get-document-mung":
            action_get_document_mung();
            break;
        
        case "get-document-mung":
            action_get_document_mung();
            break;
        
        case "get-document-thumbnail":
            action_get_document_thumbnail();
            break;

        case "upload-document-mung":
            action_upload_document_mung();
            break;

        default:
            http_response_code(404);
            echo "Specified action does not exist.\n";
            break;
    }
}


//////////
// Main //
//////////

Document::verify_documents_folder();

run_router_and_call_proper_action();
