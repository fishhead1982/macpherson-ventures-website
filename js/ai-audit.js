// AI time audit page: booking and payment links.
//
// HOW TO EDIT: paste your full URLs between the quotes below.
//   BOOKING_URL: your booking link (for example a calendar booking page).
//   PAYMENT_URL: your payment link. Only used if an element with data-cta="pay" exists on the page.
// The recommended setup is a booking link with payment collected at booking, so only BOOKING_URL is needed.
// Leave a value as '' to keep the default mailto link in the HTML, which works without JavaScript.
// If PAYMENT_URL is empty but BOOKING_URL is set, any pay element points to the booking page.
const PAYMENT_URL = '';
const BOOKING_URL = 'https://cal.com/macphersonventures/ai-time-audit';

(function () {
    var targets = {
        pay: PAYMENT_URL || BOOKING_URL,
        book: BOOKING_URL
    };
    document.querySelectorAll('[data-cta]').forEach(function (el) {
        var url = targets[el.getAttribute('data-cta')];
        if (url) el.setAttribute('href', url);
    });
})();
