<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Allow cross-origin for local dev

// CSV file path
$sheetUrl = 'https://docs.google.com/spreadsheets/d/1BFWNKZK8t230bL2XwHEJfCr2kqr1nCuZnihwmv1UFQE/edit?usp=sharing';
$soldStateFile = __DIR__ . DIRECTORY_SEPARATOR . 'sold_states.json';

function getDriveFileId($value) {
    $value = trim((string) $value);
    if ($value === '') {
        return '';
    }

    $patterns = [
        '/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/',
        '/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/',
        '/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/',
    ];

    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $value, $matches)) {
            return $matches[1];
        }
    }

    return '';
}

function getGoogleSheetCsvUrls($sheetUrl) {
    if (!preg_match('/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/', $sheetUrl, $matches)) {
        return [];
    }

    $sheetId = $matches[1];
    $gid = '0';

    $query = parse_url($sheetUrl, PHP_URL_QUERY);
    if ($query) {
        parse_str($query, $params);
        if (!empty($params['gid'])) {
            $gid = preg_replace('/[^0-9]/', '', (string) $params['gid']);
            if ($gid === '') {
                $gid = '0';
            }
        }
    }

    return [
        "https://docs.google.com/spreadsheets/d/{$sheetId}/export?format=csv&gid={$gid}",
        "https://docs.google.com/spreadsheets/d/{$sheetId}/gviz/tq?tqx=out:csv&gid={$gid}",
        "https://docs.google.com/spreadsheets/d/{$sheetId}/pub?output=csv&gid={$gid}",
    ];
}

function fetchRemoteText($url) {
    if ($url === '') {
        return false;
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT => 'Mozilla/5.0 Auction Sheet Loader',
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response !== false && $httpCode >= 200 && $httpCode < 300) {
            return $response;
        }
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: Mozilla/5.0 Auction Sheet Loader\r\n",
            'timeout' => 20,
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
        ],
    ]);

    $response = @file_get_contents($url, false, $context);
    return $response !== false ? $response : false;
}

function encodeLocalImagePath($path) {
    $parts = explode('/', str_replace('\\', '/', trim($path)));
    $parts = array_map('rawurlencode', array_filter($parts, static function ($part) {
        return $part !== '';
    }));

    return implode('/', $parts);
}

function getSoldStates($soldStateFile) {
    if (!file_exists($soldStateFile)) {
        return [];
    }

    $content = file_get_contents($soldStateFile);
    if ($content === false || trim($content) === '') {
        return [];
    }

    $states = json_decode($content, true);
    return is_array($states) ? $states : [];
}

function getSoldStateDetails($states, $id) {
    $entry = $states[(string) $id] ?? false;

    if (is_array($entry)) {
        return [
            'sold' => !empty($entry['sold']),
            'soldPrice' => trim((string) ($entry['soldPrice'] ?? '')),
            'teamName' => trim((string) ($entry['teamName'] ?? '')),
        ];
    }

    return [
        'sold' => !empty($entry),
        'soldPrice' => '',
        'teamName' => '',
    ];
}

// Get the ID from GET parameter
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    echo json_encode(['error' => 'Invalid ID']);
    exit;
}

// Open Google Sheet CSV export
$csvUrls = getGoogleSheetCsvUrls($sheetUrl);
$csvContent = false;

foreach ($csvUrls as $csvUrl) {
    $csvContent = fetchRemoteText($csvUrl);
    if ($csvContent !== false && trim($csvContent) !== '') {
        break;
    }
}

if ($csvContent === false || trim($csvContent) === '') {
    echo json_encode(['error' => 'Could not load Google Sheet CSV']);
    exit;
}

if (stripos(ltrim($csvContent), '<!doctype html') === 0 || stripos(ltrim($csvContent), '<html') === 0) {
    echo json_encode(['error' => 'Google Sheet is not publicly accessible as CSV']);
    exit;
}

$handle = fopen('php://temp', 'r+');
if (!$handle) {
    echo json_encode(['error' => 'Cannot open sheet data']);
    exit;
}
fwrite($handle, $csvContent);
rewind($handle);

// Skip header row
fgetcsv($handle);

// Loop through rows
$rowNumber = 1;
while (($data = fgetcsv($handle)) !== false) {
    if ($rowNumber == $id) {
        // CSV columns: Timestamp (0), Name (1), Series/Age (2), Category/Role (3), Picture (4)
        $name = $data[1] ?? '';
        $series = $data[2] ?? '';
        $role = $data[3] ?? '';
        $image = trim($data[4] ?? '');

        // Route Google Drive images through a local proxy to avoid browser-side Drive issues.
        $fileId = getDriveFileId($image);
        if ($fileId !== '') {
            $image = 'drive_image.php?id=' . rawurlencode($fileId);
        }

        // Allow local file names/paths from the CSV as well.
        if ($image !== '' && !filter_var($image, FILTER_VALIDATE_URL)) {
            $localImagePath = __DIR__ . DIRECTORY_SEPARATOR . $image;
            if (file_exists($localImagePath)) {
                $image = encodeLocalImagePath($image);
            }
        }

        if ($image === '') {
            $image = 'image.png';
        }

        $soldStates = getSoldStates($soldStateFile);
        $soldState = getSoldStateDetails($soldStates, $id);

        // Return JSON
        echo json_encode([
            'name' => $name,
            'series' => $series,
            'role' => $role,
            'price' => '50k',
            'image' => $image,
            'sold' => $soldState['sold'],
            'soldPrice' => $soldState['soldPrice'],
            'teamName' => $soldState['teamName']
        ]);
        fclose($handle);
        exit;
    }
    $rowNumber++;
}

// ID not found
fclose($handle);
echo json_encode(['error' => 'Player not found']);
?>
