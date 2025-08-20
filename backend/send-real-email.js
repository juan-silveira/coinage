const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function sendRealEmail() {
  try {
    console.log('📧 Configurando email real para envio...');
    
    // Criar conta de teste no Ethereal Email
    let testAccount = await nodemailer.createTestAccount();
    console.log('🔑 Conta de teste criada:', testAccount.user);
    
    // Configurar transporter
    let transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
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
      from: '"Coinage System" <noreply@coinage.app>',
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

    console.log('✅ Email enviado com sucesso!');
    console.log('📧 Message ID:', info.messageId);
    console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
    console.log('');
    console.log('📋 IMPORTANTE:');
    console.log('Este é um email de teste usando Ethereal Email.');
    console.log('Para ver o email, acesse o link Preview URL acima.');
    console.log('Este serviço simula o envio real mas não entrega na caixa de entrada real.');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

sendRealEmail();