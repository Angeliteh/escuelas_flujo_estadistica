// Proxy same-origin para Apps Script.
// Evita que el navegador tenga que seguir directamente la redirección temporal
// de script.googleusercontent.com, que algunos bloqueadores/tracking prevention
// tratan como recurso de terceros.

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyFPxVLK2RpUPC91Y1JRfowXAf5aKThAk8ERFjgkNLf-jc1uEdzIoIU73mSJzLYJNC3Sw/exec';

module.exports = async function control(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Método no permitido' });
    return;
  }

  const apiUrl = process.env.APPS_SCRIPT_URL || DEFAULT_APPS_SCRIPT_URL;
  const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});

  try {
    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload,
      redirect: 'follow'
    });
    const responseText = await upstream.text();

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (_) {
      throw new Error('Apps Script devolvió una respuesta no válida');
    }

    res.status(upstream.ok ? 200 : 502).json(responseData);
  } catch (error) {
    console.error('Error al comunicarse con Apps Script:', error.message);
    res.status(502).json({
      success: false,
      error: 'No fue posible comunicarse con el servicio escolar. Inténtalo de nuevo.'
    });
  }
};
