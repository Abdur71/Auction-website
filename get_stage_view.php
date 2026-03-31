<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$stageViewFile = __DIR__ . DIRECTORY_SEPARATOR . 'stage_view.json';

$defaultState = [
    'mode' => 'none',
    'playerId' => 0,
    'teamId' => 0,
    'search' => '',
    'status' => 'all',
];

if (!file_exists($stageViewFile)) {
    echo json_encode($defaultState);
    exit;
}

$content = file_get_contents($stageViewFile);
if ($content === false || trim($content) === '') {
    echo json_encode($defaultState);
    exit;
}

$data = json_decode($content, true);
if (!is_array($data)) {
    echo json_encode($defaultState);
    exit;
}

echo json_encode([
    'mode' => in_array(($data['mode'] ?? 'none'), ['none', 'player', 'database', 'teams', 'team', 'countdown'], true) ? $data['mode'] : 'none',
    'playerId' => isset($data['playerId']) ? intval($data['playerId']) : 0,
    'teamId' => isset($data['teamId']) ? intval($data['teamId']) : 0,
    'search' => trim((string) ($data['search'] ?? '')),
    'status' => in_array(($data['status'] ?? 'all'), ['all', 'sold', 'unsold'], true) ? $data['status'] : 'all',
]);
?>
