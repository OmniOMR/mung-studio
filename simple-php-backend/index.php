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

    if (substr($value, 0, strlen($prefix)) !== $prefix) {
        return null;
    }

    $token = trim(substr($value, strlen($prefix)));

    if (strlen($token) == 0) {
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
     * Returns true if the given string is a valid document name
     * (this makes sure the name does not contain relative fs paths etc.)
     */
    public static function is_name_valid(string $name): bool {
        $pattern = "/[a-zA-Z0-9_-]+/";
        $ret = preg_match($pattern, $name);
        return $ret === 1;
    }

    /**
     * Path to the mung file
     */
    public static function mung_path(string $name): string {
        if (!static::is_name_valid($name)) {
            throw new Exception("Invalid document name.");
        }
        return Document::documents_folder_path() . "/" . $name . "/mung.xml";
    }

    /**
     * Path to the image file
     */
    public static function image_path(string $name): string {
        if (!static::is_name_valid($name)) {
            throw new Exception("Invalid document name.");
        }
        
        foreach (["jpg", "jpeg", "png"] as $suffix) {
            $path = Document::documents_folder_path()
                . "/" . $name . "/image." . $suffix;
            if (is_file($path)) {
                return $path;
            }
        }

        throw new Exception("Document $name is missing the image file.");
    }

    /**
     * Path to the thumbnail file
     */
    public static function thumbnail_path(string $name): string {
        if (!static::is_name_valid($name)) {
            throw new Exception("Invalid document name.");
        }
        return Document::documents_folder_path() . "/" . $name . "/thumbnail.jpg";
    }

    /**
     * Path to the access log file
     */
    public static function access_log_path(string $name): string {
        if (!static::is_name_valid($name)) {
            throw new Exception("Invalid document name.");
        }
        return Document::documents_folder_path()
            . "/" . $name . "/access_log.txt";
    }

    /**
     * Path to the write log file
     */
    public static function write_log_path(string $name): string {
        if (!static::is_name_valid($name)) {
            throw new Exception("Invalid document name.");
        }
        return Document::documents_folder_path()
            . "/" . $name . "/write_log.txt";
    }

    /**
     * Path to the todays mung backup file
     */
    public static function todays_backup_mung_path(string $name): string {
        if (!static::is_name_valid($name)) {
            throw new Exception("Invalid document name.");
        }

        $today = date("Y-m-d", time());

        return Document::documents_folder_path()
            . "/" . $name . "/backups/$today.xml";
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

        if (substr($path, strlen($path) - 1) === "/") {
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
        if (!static::is_name_valid($name)) {
            return null;
        }
        
        $path = static::documents_folder_path() . "/" . $name;
        $mungPath = static::mung_path($name);
        $imagePath = static::image_path($name);

        if (!is_dir($path)) {
            return null;
        }

        if (!is_file($mungPath)) {
            return null;
        }

        $hasImage = is_file($imagePath);
        $modifiedAt = date("Y-m-d\TH:i:s\Z", filemtime($mungPath));

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

/**
 * Given path to the original image and the desired thumbnail,
 * it creates an image thumbnail using the GD PHP extension.
 */
function generate_thumbnail(string $imagePath, string $thumbnailPath) {
    $imageExtension = strtolower(pathinfo($imagePath, PATHINFO_EXTENSION));

    $image = false;
    if ($imageExtension === "jpg" || $imageExtension === "jpeg") {
        $image = imagecreatefromjpeg($imagePath);
    } else if ($imageExtension === "png") {
        $image = imagecreatefrompng($imagePath);
    } else {
        throw new Exception(
            "Cannot create thumbnail for extension file $imagePath"
        );
    }

    if ($image === false) {
        throw Exception("Failed to load image when creating a thumbnail.");
    }

    $imageWidth = imagesx($image);
    $imageHeight = imagesy($image);

    $thumbWidth = (int) (260);
    $thumbHeight = (int) (
        (float)$imageHeight * ((float)$thumbWidth / (float)$imageWidth)
    );
    
    $thumbnail = imagecreatetruecolor($thumbWidth, $thumbHeight);
    imagecopyresampled(
        $thumbnail, $image,
        0,0,0,0,
        $thumbWidth, $thumbHeight,
        $imageWidth, $imageHeight
    );

    imagejpeg($thumbnail, $thumbnailPath);
}


/////////////////////
// Logs & Auditing //
/////////////////////

/**
 * Logs a message with timestamp into a log file at the given path.
 * Creates the file is missing.
 */
function log_to_file(string $message, string $path) {
    $parentDir = dirname($path);
    
    if (!is_dir($parentDir)) {
        throw new Exception("Parent directory for log $path does not exist.");
    }

    if (!is_file($path)) {
        file_put_contents($path, "");
    }

    if (!is_writable($path)) {
        throw new Exception("File is not writable: $path");
    }

    $timestamp = date("Y-m-d\TH:i:s\Z", time());

    file_put_contents(
        $path,
        "[$timestamp]: " . $message . PHP_EOL,
        FILE_APPEND
    );

    // make sure it can be modified and deleted by non-www users
    chmod($path, 0666);
}

/**
 * Put a message into the global audit log.
 */
function log_global_audit_file(string $message) {
    global $CONFIG;
    $path = (string) $CONFIG["audit-log-path"];
    log_to_file($message, $path);
}

/**
 * Put a message into the document's write_log.txt file.
 */
function log_document_write_file(string $message, Document $document) {
    $path = Document::write_log_path($document->name);
    log_to_file($message, $path);
}

/**
 * Put a message into the document's access_log.txt file.
 */
function log_document_access_file(string $message, Document $document) {
    $path = Document::access_log_path($document->name);
    log_to_file($message, $path);
}


/////////////
// Actions //
/////////////

/**
 * Returns information about the authenticated user
 */
function action_whoami() {
    $user = authenticate_and_get_user();

    header("Content-Type: application/json; charset=utf-8");
    echo json_encode([
        "name" => $user->name
    ], JSON_PRETTY_PRINT);
}

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

    if (array_key_exists("document", $_GET)) {
        $documentName = (string) $_GET["document"];
    } else {
        http_response_code(400);
        echo "Missing document query parameter.";
        return;
    }

    $document = Document::try_load($documentName);

    if ($document === null) {
        http_response_code(404);
        return;
    }

    $mungPath = Document::mung_path($document->name);

    if (!is_file($mungPath)) {
        http_response_code(404);
        return;
    }

    // log access
    log_global_audit_file(
        "$user->name openned $document->name document."
    );
    log_document_access_file(
        "$user->name openned this document.",
        $document
    );

    // send the mung file to the client
    header("Content-Type: application/mung+xml");
    header("Content-Length: " . filesize($mungPath));
    header("Cache-Control: no-store");
    readfile($mungPath);
}

/**
 * Returns the image for a document
 */
function action_get_document_image() {
    $user = authenticate_and_get_user();

    if (array_key_exists("document", $_GET)) {
        $documentName = (string) $_GET["document"];
    } else {
        http_response_code(400);
        echo "Missing document query parameter.";
        return;
    }

    $document = Document::try_load($documentName);

    if ($document === null) {
        http_response_code(404);
        return;
    }

    $imagePath = Document::image_path($document->name);
    $imageExtension = strtolower(pathinfo($imagePath, PATHINFO_EXTENSION));

    if (!is_file($imagePath)) {
        http_response_code(404);
        return;
    }

    // send the image file to the client
    if ($imageExtension === "jpg" || $imageExtension === "jpeg") {
        header("Content-Type: image/jpeg");
    } else if ($imageExtension === "png") {
        header("Content-Type: image/png");
    } else {
        header("Content-Type: application/octet-stream");
    }
    header("Content-Length: " . filesize($imagePath));
    header("Cache-Control: no-store");
    readfile($imagePath);
}

/**
 * Returns the thumbnail image for a document
 */
function action_get_document_thumbnail() {
    $user = authenticate_and_get_user();

    if (!extension_loaded("gd")) {
        http_response_code(500);
        echo "GD PHP extension is not available to generate thumbnails.";
        return;
    }

    if (array_key_exists("document", $_GET)) {
        $documentName = (string) $_GET["document"];
    } else {
        http_response_code(400);
        echo "Missing document query parameter.";
        return;
    }

    $document = Document::try_load($documentName);

    if ($document === null) {
        http_response_code(404);
        return;
    }

    $imagePath = Document::image_path($document->name);
    $thumbnailPath = Document::thumbnail_path($document->name);

    // generate the thumbnail if missing
    if (!is_file($thumbnailPath)) {
        generate_thumbnail($imagePath, $thumbnailPath);
    }
    
    // send the jpg file to the client
    header("Content-Type: image/jpeg");
    header("Content-Length: " . filesize($thumbnailPath));
    header("Cache-Control: max-age=604800"); // cache for a week
    readfile($thumbnailPath);
}

/**
 * Accepts an updated version of a MuNG document
 */
function action_upload_document_mung() {
    $user = authenticate_and_get_user();

    if (array_key_exists("document", $_GET)) {
        $documentName = (string) $_GET["document"];
    } else {
        http_response_code(400);
        echo "Missing document query parameter.";
        return;
    }

    $document = Document::try_load($documentName);

    if ($document === null) {
        http_response_code(404);
        return;
    }

    $mungPath = Document::mung_path($document->name);

    // log access
    log_global_audit_file(
        "$user->name has written $document->name document."
    );
    log_document_access_file(
        "$user->name has written this document.",
        $document
    );
    log_document_write_file(
        "$user->name has written this document.",
        $document
    );

    // read the uploaded file and verify its completeness
    $uploadedMungXml = file_get_contents("php://input");
    if (strlen($uploadedMungXml) != $_SERVER["CONTENT_LENGTH"]) {
        http_response_code(400);
        echo "Sent request body does not match the sent content length header.\n";
        echo "Header: " . $_SERVER["HTTP_CONTENT_LENGTH"] . "\n";
        echo "Body: " . strlen($uploadedMungXml) . "\n";
        return;
    }

    // store the uploaded file
    file_put_contents($mungPath, $uploadedMungXml);
    chmod($mungPath, 0666);

    // store the corresponding backup snapshot
    $backupPath = Document::todays_backup_mung_path($document->name);
    if (!is_dir(dirname($backupPath))) {
        mkdir(dirname($backupPath));
        
        // make sure it can be modified and deleted by non-www users
        chmod(dirname($backupPath), 0777);
    }
    file_put_contents($backupPath, $uploadedMungXml);

    // make sure it can be modified and deleted by non-www users
    chmod($backupPath, 0666);
}


////////////
// Router //
////////////

/**
 * The routing function itself
 */
function run_router_and_call_proper_action() {
    if (array_key_exists("action", $_GET)) {
        $action = $_GET["action"]; // string or null
    } else {
        http_response_code(400);
        echo "Missing action query parameter.";
        return;
    }

    switch ($action) {
        case "whoami":
            action_whoami();
            break;

        case "list-documents":
            action_list_documents();
            break;
        
        case "get-document-mung":
            action_get_document_mung();
            break;
        
        case "get-document-image":
            action_get_document_image();
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
// CORS //
//////////

/**
 * Handles CORS-related request logic
 * https://developer.mozilla.org/en-US/docs/Glossary/CORS
 */
function cors() {
    header("Access-Control-Allow-Origin: *");

    if ($_SERVER["REQUEST_METHOD"] == "OPTIONS") {
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        header("Access-Control-Allow-Headers: *");
        exit;
    }
}


//////////
// Main //
//////////

Document::verify_documents_folder();

cors();

run_router_and_call_proper_action();
