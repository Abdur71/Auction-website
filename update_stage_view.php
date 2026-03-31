<?php
require_once __DIR__ . DIRECTORY_SEPARATOR . 'auth.php';
requireAdminAuth();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$stageViewFile = __DIR__ . DIRECTORY_SEPARATOR . 'stage_view.json';

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (!is_array($payload)) {
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$mode = trim((string) ($payload['mode'] ?? 'player'));
if (!in_array($mode, ['none', 'player', 'database', 'teams', 'team', 'countdown'], true)) {
    echo json_encode(['error' => 'Invalid mode']);
    exit;
}

$playerId = isset($payload['playerId']) ? intval($payload['playerId']) : 0;
$teamId = isset($payload['teamId']) ? intval($payload['teamId']) : 0;
$search = trim((string) ($payload['search'] ?? ''));
$status = trim((string) ($payload['status'] ?? 'all'));

if (!in_array($status, ['all', 'sold', 'unsold'], true)) {
    $status = 'all';
}

$data = [
    'mode' => $mode,
    'playerId' => $playerId > 0 ? $playerId : 0,
    'teamId' => $teamId > 0 ? $teamId : 0,
    'search' => $search,
    'status' => $status,
    'updatedAt' => date('c'),
];

if (file_put_contents($stageViewFile, json_encode($data, JSON_PRETTY_PRINT)) === false) {
    echo json_encode(['error' => 'Could not save stage view']);
    exit;
}

echo json_encode([
    'success' => true,
    'mode' => $data['mode'],
    'playerId' => $data['playerId'],
    'teamId' => $data['teamId'],
    'search' => $data['search'],
    'status' => $data['status'],
]);
?>
