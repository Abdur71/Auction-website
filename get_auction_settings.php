<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$settingsFile = __DIR__ . DIRECTORY_SEPARATOR . 'auction_settings.json';

$defaultSettings = [
    'startTime' => '',
    'endMessage' => 'Auction has started.',
];

if (!file_exists($settingsFile)) {
    echo json_encode($defaultSettings);
    exit;
}

$content = file_get_contents($settingsFile);
if ($content === false || trim($content) === '') {
    echo json_encode($defaultSettings);
    exit;
}

$data = json_decode($content, true);
if (!is_array($data)) {
    echo json_encode($defaultSettings);
    exit;
}

echo json_encode([
    'startTime' => trim((string) ($data['startTime'] ?? '')),
    'endMessage' => trim((string) ($data['endMessage'] ?? '')) !== '' ? trim((string) ($data['endMessage'] ?? '')) : $defaultSettings['endMessage'],
]);
?>
