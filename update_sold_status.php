<?php
require_once __DIR__ . DIRECTORY_SEPARATOR . 'auth.php';
requireAdminAuth();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$soldStateFile = __DIR__ . DIRECTORY_SEPARATOR . 'sold_states.json';

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (!is_array($payload)) {
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$id = isset($payload['id']) ? intval($payload['id']) : 0;
$sold = !empty($payload['sold']);
$soldPrice = trim((string) ($payload['sold_price'] ?? ''));
$teamName = trim((string) ($payload['team_name'] ?? ''));

if ($id <= 0) {
    echo json_encode(['error' => 'Invalid player ID']);
    exit;
}

$states = [];
if (file_exists($soldStateFile)) {
    $existing = file_get_contents($soldStateFile);
    $decoded = json_decode($existing, true);
    if (is_array($decoded)) {
        $states = $decoded;
    }
}

if ($sold) {
    $states[(string) $id] = [
        'sold' => true,
        'soldPrice' => $soldPrice,
        'teamName' => $teamName,
    ];
} else {
    unset($states[(string) $id]);
}

if (file_put_contents($soldStateFile, json_encode($states, JSON_PRETTY_PRINT)) === false) {
    echo json_encode(['error' => 'Could not save sold status']);
    exit;
}

echo json_encode([
    'success' => true,
    'id' => $id,
    'sold' => $sold,
    'soldPrice' => $sold ? $soldPrice : '',
    'teamName' => $sold ? $teamName : ''
]);
?>
