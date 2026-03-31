<?php
$fallbackImage = __DIR__ . DIRECTORY_SEPARATOR . 'image.png';

function sendFallbackImage($fallbackImage) {
    if (file_exists($fallbackImage)) {
        header('Content-Type: image/png');
        readfile($fallbackImage);
        exit;
    }

    http_response_code(404);
    exit('Image not found');
}

function outputRemoteImage($body, $contentType) {
    header('Cache-Control: public, max-age=300');
    header('Content-Type: ' . ($contentType ?: 'image/jpeg'));
    echo $body;
    exit;
}

function fetchWithCurl($url) {
    if (!function_exists('curl_init')) {
        return null;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_USERAGENT => 'Mozilla/5.0 Auction Image Proxy',
        CURLOPT_HTTPHEADER => [
            'Accept: image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        ],
        CURLOPT_HEADER => true,
    ]);

    $response = curl_exec($ch);
    if ($response === false) {
        curl_close($ch);
        return null;
    }

    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $body = substr($response, $headerSize);
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300 && $body !== '') {
        return [
            'body' => $body,
            'content_type' => $contentType,
        ];
    }

    return null;
}

function fetchWithStreams($url) {
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: Mozilla/5.0 Auction Image Proxy\r\nAccept: image/*,*/*;q=0.8\r\n",
            'timeout' => 20,
            'follow_location' => 1,
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
        ],
    ]);

    $body = @file_get_contents($url, false, $context);
    if ($body === false || $body === '') {
        return null;
    }

    $contentType = null;
    if (!empty($http_response_header)) {
        foreach ($http_response_header as $headerLine) {
            if (stripos($headerLine, 'Content-Type:') === 0) {
                $contentType = trim(substr($headerLine, strlen('Content-Type:')));
                break;
            }
        }
    }

    return [
        'body' => $body,
        'content_type' => $contentType,
    ];
}

$fileId = isset($_GET['id']) ? trim((string) $_GET['id']) : '';
if ($fileId === '' || !preg_match('/^[a-zA-Z0-9_-]+$/', $fileId)) {
    sendFallbackImage($fallbackImage);
}

$driveUrls = [
    "https://drive.google.com/thumbnail?id={$fileId}&sz=w1200",
    "https://drive.google.com/uc?export=download&id={$fileId}",
];

foreach ($driveUrls as $url) {
    $result = fetchWithCurl($url);
    if ($result !== null) {
        outputRemoteImage($result['body'], $result['content_type']);
    }

    $result = fetchWithStreams($url);
    if ($result !== null) {
        outputRemoteImage($result['body'], $result['content_type']);
    }
}

sendFallbackImage($fallbackImage);
?>
