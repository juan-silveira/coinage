const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function sendGmailEmail() {
  try {
    console.log('📧 Tentando enviar via Gmail...');
    
    // Configurar transporter com Gmail (usando uma conta de desenvolvimento)
    // Nota: Em produção, você deve usar OAuth2 ou App Passwords
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'coinage.system.test@gmail.com', // Você precisaria criar esta conta
        pass: 'app-password-aqui' // Você precisaria gerar um app password
      },
    });
    
    // Ler template
    const templatePath = path.join(__dirname, 'src/templates/email/welcome.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Substituir variáveis
    htmlTemplate = htmlTemplate
      .replace(/{{userName}}/g, 'Juan')
      .replace(/{{companyName}}/g, 'Navi')
      .replace(/{{companyLogo}}/g, 'https://via.placeholder.com/120x32/4B5563/FFFFFF?text=NAVI')
      .replace(/{{loginUrl}}/g, 'http://localhost:3000/login')
      .replace(/{{dashboardUrl}}/g, 'http://localhost:3000/dashboard')
      .replace(/{{supportEmail}}/g, 'suporte@coinage.app');
    
    // Configurar email
    let info = await transporter.sendMail({
      from: '"Coinage System" <coinage.system.test@gmail.com>',
      to: 'juansilveira@gmail.com',
      subject: 'Bem-vindo ao Coinage - Conta Criada com Sucesso',
      html: htmlTemplate,
      text: `Bem-vindo ao Coinage!

Olá Juan,

Sua conta foi criada com sucesso e está pronta para uso.

Funcionalidades disponíveis:
• Transações PIX - Depósitos e saques via PIX
• Segurança - Autenticação de dois fatores
• Dashboard - Acompanhe suas transações

Próximos passos:
1. Complete seu perfil
2. Configure a autenticação de dois fatores
3. Explore o dashboard

Acesse: http://localhost:3000/dashboard

Precisa de ajuda? Entre em contato: suporte@coinage.app

Sistema Coinage`
    });

    console.log('✅ Email enviado para sua caixa de entrada!');
    console.log('📧 Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('');
    console.log('📋 Para enviar email real para sua caixa de entrada, você precisa:');
    console.log('1. Criar uma conta Gmail para o sistema');
    console.log('2. Ativar autenticação de 2 fatores');
    console.log('3. Gerar um App Password específico');
    console.log('4. Configurar as credenciais no código');
    console.log('');
    console.log('🔄 Alternativa: Use o preview do email no link Ethereal acima');
  }
}

sendGmailEmail();