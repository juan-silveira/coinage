// Lista de bancos brasileiros com códigos e informações
const BRAZILIAN_BANKS = [
  {
    code: '001',
    name: 'Banco do Brasil S.A.',
    shortName: 'Banco do Brasil',
    logo: 'https://logoeps.com/wp-content/uploads/2013/03/banco-do-brasil-vector-logo.png',
    color: '#FFD700',
    ispb: '00000000',
    type: 'commercial'
  },
  {
    code: '077',
    name: 'Banco Inter S.A.',
    shortName: 'Inter',
    logo: 'https://logoeps.com/wp-content/uploads/2014/09/banco-inter-vector-logo.png',
    color: '#FF7A00',
    ispb: '00416968',
    type: 'digital'
  },
  {
    code: '341',
    name: 'Itaú Unibanco S.A.',
    shortName: 'Itaú',
    logo: 'https://logoeps.com/wp-content/uploads/2013/03/itau-vector-logo.png',
    color: '#EC7000',
    ispb: '60701190',
    type: 'commercial'
  },
  {
    code: '033',
    name: 'Banco Santander (Brasil) S.A.',
    shortName: 'Santander',
    logo: 'https://logoeps.com/wp-content/uploads/2013/03/santander-vector-logo.png',
    color: '#EC0000',
    ispb: '90400888',
    type: 'commercial'
  },
  {
    code: '104',
    name: 'Caixa Econômica Federal',
    shortName: 'Caixa',
    logo: 'https://logoeps.com/wp-content/uploads/2013/03/caixa-economica-federal-vector-logo.png',
    color: '#0066CC',
    ispb: '00360305',
    type: 'public'
  },
  {
    code: '237',
    name: 'Banco Bradesco S.A.',
    shortName: 'Bradesco',
    logo: 'https://logoeps.com/wp-content/uploads/2013/03/bradesco-vector-logo.png',
    color: '#E20A16',
    ispb: '60746948',
    type: 'commercial'
  },
  {
    code: '260',
    name: 'Nu Pagamentos S.A.',
    shortName: 'Nubank',
    logo: 'https://logoeps.com/wp-content/uploads/2014/09/nubank-vector-logo.png',
    color: '#8A05BE',
    ispb: '18236120',
    type: 'digital'
  },
  {
    code: '323',
    name: 'Mercado Pago - conta do Mercado Livre',
    shortName: 'Mercado Pago',
    logo: 'https://logoeps.com/wp-content/uploads/2014/09/mercado-pago-vector-logo.png',
    color: '#2D9CDB',
    ispb: '10573521',
    type: 'digital'
  },
  {
    code: '336',
    name: 'Banco C6 Bank S.A.',
    shortName: 'C6 Bank',
    logo: 'https://logoeps.com/wp-content/uploads/2018/05/c6-bank-vector-logo.png',
    color: '#FFD700',
    ispb: '31880826',
    type: 'digital'
  },
  {
    code: '290',
    name: 'PagSeguro Digital Ltd.',
    shortName: 'PagBank',
    logo: 'https://logoeps.com/wp-content/uploads/2014/09/pagbank-vector-logo.png',
    color: '#00D5AA',
    ispb: '08561701',
    type: 'digital'
  },
  {
    code: '422',
    name: 'Banco Safra S.A.',
    shortName: 'Safra',
    logo: 'https://logoeps.com/wp-content/uploads/2013/03/safra-vector-logo.png',
    color: '#1E3A8A',
    ispb: '58160789',
    type: 'commercial'
  },
  {
    code: '655',
    name: 'Banco Votorantim S.A.',
    shortName: 'Votorantim',
    logo: 'https://logoeps.com/wp-content/uploads/2013/03/votorantim-vector-logo.png',
    color: '#FF6B00',
    ispb: '59588111',
    type: 'commercial'
  },
  {
    code: '212',
    name: 'Banco Original S.A.',
    shortName: 'Original',
    logo: 'https://logoeps.com/wp-content/uploads/2014/09/original-vector-logo.png',
    color: '#00B5E2',
    ispb: '92702067',
    type: 'digital'
  },
  {
    code: '208',
    name: 'Banco BTG Pactual S.A.',
    shortName: 'BTG Pactual',
    logo: 'https://logoeps.com/wp-content/uploads/2014/09/btg-pactual-vector-logo.png',
    color: '#1B365D',
    ispb: '30306294',
    type: 'investment'
  },
  {
    code: '318',
    name: 'Banco BMG S.A.',
    shortName: 'BMG',
    logo: 'https://logoeps.com/wp-content/uploads/2013/03/bmg-vector-logo.png',
    color: '#0066CC',
    ispb: '61186680',
    type: 'commercial'
  },
  {
    code: '746',
    name: 'Banco Modal S.A.',
    shortName: 'Modal',
    logo: 'https://logoeps.com/wp-content/uploads/2014/09/modal-vector-logo.png',
    color: '#2E8B57',
    ispb: '30723886',
    type: 'digital'
  },
  {
    code: '380',
    name: 'PicPay Servicos S.A.',
    shortName: 'PicPay',
    logo: 'https://logoeps.com/wp-content/uploads/2018/05/picpay-vector-logo.png',
    color: '#21C25E',
    ispb: '22896431',
    type: 'digital'
  },
  {
    code: '652',
    name: 'Itaú Unibanco Holding S.A.',
    shortName: 'Itaú Holding',
    logo: 'https://logoeps.com/wp-content/uploads/2013/03/itau-vector-logo.png',
    color: '#EC7000',
    ispb: '60701190',
    type: 'holding'
  },
  {
    code: '623',
    name: 'Banco Pan S.A.',
    shortName: 'Pan',
    logo: 'https://logoeps.com/wp-content/uploads/2014/09/pan-vector-logo.png',
    color: '#0066FF',
    ispb: '59285411',
    type: 'commercial'
  },
  {
    code: '280',
    name: 'Banco Avista S.A.',
    shortName: 'Avista',
    logo: 'https://logoeps.com/wp-content/uploads/2014/09/avista-vector-logo.png',
    color: '#FF4500',
    ispb: '28127603',
    type: 'commercial'
  }
];

// Tipos de conta
const ACCOUNT_TYPES = [
  {
    value: 'corrente',
    label: 'Conta Corrente',
    description: 'Conta para movimentação diária'
  },
  {
    value: 'poupanca',
    label: 'Conta Poupança', 
    description: 'Conta para guardar dinheiro'
  },
  {
    value: 'pagamentos',
    label: 'Conta de Pagamentos',
    description: 'Conta para pagamentos e transferências'
  },
  {
    value: 'salario',
    label: 'Conta Salário',
    description: 'Conta para recebimento de salário'
  }
];

// Função para buscar banco por código
function getBankByCode(code) {
  return BRAZILIAN_BANKS.find(bank => bank.code === code.toString().padStart(3, '0'));
}

// Função para buscar bancos por nome
function searchBanksByName(name) {
  if (!name) return BRAZILIAN_BANKS;
  
  const searchTerm = name.toLowerCase();
  return BRAZILIAN_BANKS.filter(bank => 
    bank.name.toLowerCase().includes(searchTerm) ||
    bank.shortName.toLowerCase().includes(searchTerm)
  );
}

// Função para obter bancos por tipo
function getBanksByType(type) {
  if (!type) return BRAZILIAN_BANKS;
  return BRAZILIAN_BANKS.filter(bank => bank.type === type);
}

// Função para validar código do banco
function validateBankCode(code) {
  const bank = getBankByCode(code);
  return {
    isValid: !!bank,
    bank: bank || null
  };
}

// Função para formatar número da conta
function formatAccountNumber(accountNumber, accountDigit) {
  if (!accountNumber || !accountDigit) return '';
  return `${accountNumber}-${accountDigit}`;
}

// Função para formatar agência
function formatAgency(agency, agencyDigit = null) {
  if (!agency) return '';
  return agencyDigit ? `${agency}-${agencyDigit}` : agency;
}

module.exports = {
  BRAZILIAN_BANKS,
  ACCOUNT_TYPES,
  getBankByCode,
  searchBanksByName,
  getBanksByType,
  validateBankCode,
  formatAccountNumber,
  formatAgency
};