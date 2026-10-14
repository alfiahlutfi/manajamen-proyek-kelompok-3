const BASE_URL = "api/";

/*
|--------------------------------------------------------------------------
| PEMETAAN ENDPOINT FRONTEND → API BACKEND
|--------------------------------------------------------------------------
*/

const API_MAP = {

    "/cafe": "cafe.php",

    "/menu": "menu.php",

    "/gallery": "gallery.php",

    "/areas": "area.php",

    "/events": "event.php",

    "/carousel": "carousel.php",

    "/faqs": "faq.php",

    "/menu-category": "menu_category.php",

    "/operating-hours": "operating_hours.php"

};


/*
|--------------------------------------------------------------------------
| FETCH DATA
|--------------------------------------------------------------------------
*/

async function fetchData(endpoint) {

    try {

        // Hilangkan slash awal
        const cleanEndpoint =
            endpoint.startsWith("/")
                ? endpoint
                : "/" + endpoint;


        /*
        |--------------------------------------------------------------------------
        | CEK DETAIL
        |--------------------------------------------------------------------------
        |
        | Contoh:
        | fetchData("/events/2")
        |
        */

        const detailMatch =
            cleanEndpoint.match(/^(.+)\/(\d+)$/);

        let apiEndpoint =
            cleanEndpoint;

        let detailId =
            null;


        if (detailMatch) {

            apiEndpoint =
                detailMatch[1];

            detailId =
                Number(detailMatch[2]);
        }


        /*
        |--------------------------------------------------------------------------
        | CARI FILE API BACKEND
        |--------------------------------------------------------------------------
        */

        const fileName =
            API_MAP[apiEndpoint];

        if (!fileName) {

            console.error(
                "Endpoint tidak terdaftar:",
                endpoint
            );

            return null;
        }


        const url =
            BASE_URL + fileName;


        /*
        |--------------------------------------------------------------------------
        | REQUEST KE BACKEND
        |--------------------------------------------------------------------------
        */

        const res =
            await fetch(url);


        if (!res.ok) {

            throw new Error(
                "HTTP " + res.status
            );
        }


        const json =
            await res.json();


        /*
        |--------------------------------------------------------------------------
        | CEK RESPONSE BACKEND
        |--------------------------------------------------------------------------
        */

        if (!json.success) {

            throw new Error(
                json.message ||
                "Gagal mengambil data"
            );
        }


        /*
        |--------------------------------------------------------------------------
        | DETAIL DATA
        |--------------------------------------------------------------------------
        */

        if (detailId !== null) {

            if (!Array.isArray(json.data)) {
                return null;
            }

            return (
                json.data.find(
                    item =>
                        Number(item.id) ===
                        detailId
                ) || null
            );
        }


        /*
        |--------------------------------------------------------------------------
        | DATA LIST
        |--------------------------------------------------------------------------
        */

        return json.data;


    } catch (err) {

        console.error(
            "Gagal mengambil " +
            endpoint +
            ":",
            err
        );

        return null;
    }
}


/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
*/

function esc(text) {

    const d =
        document.createElement("div");

    d.textContent =
        text ?? "";

    return d.innerHTML;
}