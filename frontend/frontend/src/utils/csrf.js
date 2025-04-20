// Fonction pour récupérer le token CSRF depuis les cookies
export const getCsrfToken = () => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, 'csrftoken'.length + 1) === ('csrftoken' + '=')) {
                cookieValue = decodeURIComponent(cookie.substring('csrftoken'.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

// Fonction pour vérifier si le token CSRF est présent
export const hasCsrfToken = () => {
    return getCsrfToken() !== null;
}; 