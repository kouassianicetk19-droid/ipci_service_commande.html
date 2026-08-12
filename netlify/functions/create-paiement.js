exports.handler = async (event) => {
  // Configuration des en-têtes CORS standards pour les requêtes web
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  // Gestion de la requête de vérification préalable (Preflight OPTIONS)
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

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

    // Récupération des variables d'environnement
    const masterKey = process.env.paydunya || process.env.PAYDUNYA_MASTER_KEY;
    const privateKey = process.env.private || process.env.PAYDUNYA_PRIVATE_KEY;
    const tokenKey = process.env.token || process.env.PAYDUNYA_TOKEN;

    if (!masterKey || !privateKey || !tokenKey) {
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
          "PAYDUNYA-MASTER-KEY": masterKey,
          "PAYDUNYA-PRIVATE-KEY": privateKey,
          "PAYDUNYA-TOKEN": tokenKey
        },
        body: JSON.stringify({
          invoice: {
            total_amount: amount,
            description: "Abonnement IPTV - IPCI SERVICE"
          },
          store: {
            name: "IPCI SERVICE"
          },
          customer: {
            name: nom,
            phone: telephone
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
