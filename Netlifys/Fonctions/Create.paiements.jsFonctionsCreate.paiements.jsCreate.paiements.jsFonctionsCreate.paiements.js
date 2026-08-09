exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Méthode non autorisée" })
    };
  }

  try {
    const { nom, telephone, offre } = JSON.parse(event.body);

    if (!nom || !telephone || !offre) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Informations manquantes" })
      };
    }

    const montant = Number(offre);

    if (![20000, 30000, 25000].includes(montant)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Montant invalide" })
      };
    }

    const reponse = await fetch(
      "https://app.paydunya.com/api/v1/checkout-invoice/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PAYDUNYA-MASTER-KEY": process.env.PAYDUNYA_MASTER_KEY,
          "PAYDUNYA-PRIVATE-KEY": process.env.PAYDUNYA_PRIVATE_KEY,
          "PAYDUNYA-TOKEN": process.env.PAYDUNYA_TOKEN
        },
        body: JSON.stringify({
          invoice: {
            total_amount: montant,
            description: "Commande IPCI SERVICE",
            customer: {
              name: nom,
              phone: telephone
            }
          },
          store: {
            name: "IPCI SERVICE"
          }
        })
      }
    );

    const data = await reponse.json();

    if (data.response_code !== "00") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: data.response_text || "Erreur PayDunya"
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        payment_url: data.response_text
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erreur serveur"
      })
    };
  }
};
