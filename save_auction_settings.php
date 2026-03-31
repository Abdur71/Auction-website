<?php
require_once __DIR__ . DIRECTORY_SEPARATOR . 'auth.php';
requireAdminAuth();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$settingsFile = __DIR__ . DIRECTORY_SEPARATOR . 'auction_settings.json';

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (!is_array($payload)) {
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$startTime = trim((string) ($payload['start_time'] ?? ''));
$endMessage = trim((string) ($payload['end_message'] ?? ''));

if ($startTime === '') {
    echo json_encode(['error' => 'Auction start time is required']);
    exit;
}

if ($endMessage === '') {
    $endMessage = 'Auction has started.';
}

$data = [
    'startTime' => $startTime,
    'endMessage' => $endMessage,
    'updatedAt' => date('c'),
];

if (file_put_contents($settingsFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) === false) {
    echo json_encode(['error' => 'Could not save auction settings']);
    exit;
}

echo json_encode([
    'success' => true,
    'startTime' => $startTime,
    'endMessage' => $endMessage,
]);
?>
