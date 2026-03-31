<?php
require_once __DIR__ . DIRECTORY_SEPARATOR . 'auth.php';
requireAdminAuth();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$currentPlayerFile = __DIR__ . DIRECTORY_SEPARATOR . 'current_player.json';

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (!is_array($payload)) {
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$id = isset($payload['id']) ? intval($payload['id']) : 0;
if ($id <= 0) {
    echo json_encode(['error' => 'Invalid player ID']);
    exit;
}

$data = [
    'id' => $id,
    'updatedAt' => date('c'),
];

if (file_put_contents($currentPlayerFile, json_encode($data, JSON_PRETTY_PRINT)) === false) {
    echo json_encode(['error' => 'Could not save current player']);
    exit;
}

echo json_encode([
    'success' => true,
    'id' => $id
]);
?>
