exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json"
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Méthode non autorisée"
      })
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");

    const amount = Number(data.prix);
    const nom = data.nom || "Client IPCI SERVICE";
    const telephone = data.telephone || "";

    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Montant invalide"
        })
      };
    }

    if (!process.env.paydunya ||
        !process.env.private ||
        !process.env.token) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Les clés PayDunya ne sont pas configurées dans Netlify."
        })
      };
    }

    const response = await fetch(
      "https://app.paydunya.com/api/v1/checkout-invoice/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PAYDUNYA-MASTER-KEY": process.env.paydunya,
          "PAYDUNYA-PRIVATE-KEY": process.env.private,
          "PAYDUNYA-TOKEN": process.env.token
        },
        body: JSON.stringify({
          invoice: {
            total_amount: amount,
            description: "Abonnement IPTV - IPCI SERVICE"
          },
          store: {
            name: "IPCI SERVICE"
          }
        })
      }
    );

    const text = await response.text();

    let result;

    try {
      result = JSON.parse(text);
    } catch {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          success: false,
          error: "PayDunya n'a pas renvoyé une réponse JSON.",
          response: text
        })
      };
    }

    if (result.response_code !== "00") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: result.response_text || "Erreur PayDunya",
          details: result
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        url: result.response_text,
        token: result.token
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
