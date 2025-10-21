const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertLessThanThousand(num: number): string {
  if (num === 0) return '';
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) {
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
  }
  return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertLessThanThousand(num % 100) : '');
}

export function numberToWordsIndian(amount: number): string {
  if (amount === 0) return 'Zero Rupees Only';

  let rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = '';

  if (rupees >= 10000000) {
    const crores = Math.floor(rupees / 10000000);
    words += convertLessThanThousand(crores) + ' Crore ';
    rupees %= 10000000;
  }

  if (rupees >= 100000) {
    const lakhs = Math.floor(rupees / 100000);
    words += convertLessThanThousand(lakhs) + ' Lakh ';
    rupees %= 100000;
  }

  if (rupees >= 1000) {
    const thousands = Math.floor(rupees / 1000);
    words += convertLessThanThousand(thousands) + ' Thousand ';
    rupees %= 1000;
  }

  if (rupees > 0) {
    words += convertLessThanThousand(rupees);
  }

  words = words.trim();

  if (paise > 0) {
    words += ' Rupees and ' + convertLessThanThousand(paise) + ' Paise Only';
  } else {
    words += ' Rupees Only';
  }

  return words;
}
