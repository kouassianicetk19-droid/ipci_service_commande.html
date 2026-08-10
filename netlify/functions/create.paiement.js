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

    const body = JSON.parse(event.body || "{}");

    const {
      nom,
      telephone,
      offre,
      prix,
      paiement,
      message
    } = body;

    if (!nom || !telephone || !offre || !prix || !paiement) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Informations de commande manquantes"
        })
      };
    }

    /*
      TEST DE LA FONCTION

      Pour l'instant, on vérifie seulement que
      Netlify reçoit correctement la commande.

      Le branchement PayDunya sera ajouté ensuite.
    */

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Commande reçue avec succès",
        commande: {
          nom,
          telephone,
          offre,
          prix,
          paiement,
          message
        }
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
