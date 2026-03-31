<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$currentPlayerFile = __DIR__ . DIRECTORY_SEPARATOR . 'current_player.json';

if (!file_exists($currentPlayerFile)) {
    echo json_encode([
        'id' => 0
    ]);
    exit;
}

$content = file_get_contents($currentPlayerFile);
if ($content === false || trim($content) === '') {
    echo json_encode([
        'id' => 0
    ]);
    exit;
}

$data = json_decode($content, true);
if (!is_array($data)) {
    echo json_encode([
        'id' => 0
    ]);
    exit;
}

echo json_encode([
    'id' => isset($data['id']) ? intval($data['id']) : 0
]);
?>
