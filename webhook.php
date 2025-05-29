<?php
// webhook.php
$data = json_decode(file_get_contents('php://input'), true);
if ($data && isset($data['status'])) {
    $orderId = $data['order_id'] ?? '';
    $status = $data['status'];

    // TODO: update status order di database sesuai $orderId dan $status
    // Contoh: jika $status == 'paid', update order menjadi Success

    // Log data untuk debugging (opsional)
    file_put_contents('webhook.log', print_r($data, true), FILE_APPEND);

    http_response_code(200);
} else {
    http_response_code(400);
}
?>
