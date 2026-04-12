// Date formatters
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

export function formatMonthYYYY(monthString) {
  if (!monthString) return '';
  // expects YYYY-MM
  const parts = monthString.split('-');
  if (parts.length !== 2) return monthString;
  const date = new Date(parts[0], parseInt(parts[1]) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Currency formatters
export function formatCurrency(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₱0.00';
  return '₱' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Common ID generation
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Image compression using Canvas
export function compressImage(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Compress as JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      callback(dataUrl);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// Simple debounce
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
