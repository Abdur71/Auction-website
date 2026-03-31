<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$sheetUrl = 'https://docs.google.com/spreadsheets/d/1BFWNKZK8t230bL2XwHEJfCr2kqr1nCuZnihwmv1UFQE/edit?usp=sharing';
$soldStateFile = __DIR__ . DIRECTORY_SEPARATOR . 'sold_states.json';

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
            CURLOPT_USERAGENT => 'Mozilla/5.0 Auction Admin Loader',
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
            'header' => "User-Agent: Mozilla/5.0 Auction Admin Loader\r\n",
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

$csvContent = false;
foreach (getGoogleSheetCsvUrls($sheetUrl) as $csvUrl) {
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

fgetcsv($handle);

$soldStates = getSoldStates($soldStateFile);
$players = [];
$rowNumber = 1;

while (($data = fgetcsv($handle)) !== false) {
    $soldState = getSoldStateDetails($soldStates, $rowNumber);

    $players[] = [
        'id' => $rowNumber,
        'name' => trim((string) ($data[1] ?? '')),
        'series' => trim((string) ($data[2] ?? '')),
        'category' => trim((string) ($data[3] ?? '')),
        'status' => $soldState['sold'] ? 'Sold' : 'Unsold',
        'soldPrice' => $soldState['soldPrice'],
        'teamName' => $soldState['teamName'],
    ];
    $rowNumber++;
}

fclose($handle);

echo json_encode([
    'players' => $players,
    'total' => count($players),
    'sold' => count(array_filter($players, static function ($player) {
        return $player['status'] === 'Sold';
    })),
], JSON_UNESCAPED_SLASHES);
?>
