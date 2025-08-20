const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function sendViaSmtp2Go() {
  try {
    console.log('📧 Enviando email via SMTP2GO (serviço gratuito)...');
    
    // SMTP2GO oferece 1000 emails gratuitos por mês
    // Você precisaria se registrar em https://www.smtp2go.com/ e obter credenciais
    let transporter = nodemailer.createTransport({
      host: 'mail.smtp2go.com',
      port: 587,
      secure: false,
      auth: {
        user: 'seu-usuario-smtp2go', // Você precisaria obter estas credenciais
        pass: 'sua-senha-smtp2go'
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
      html: htmlTemplate
    });

    console.log('✅ Email enviado para sua caixa de entrada real!');
    console.log('📧 Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('');
    console.log('🎯 SOLUÇÕES PARA RECEBER EMAIL REAL:');
    console.log('');
    console.log('1. 📧 MailerSend (Atual) - Precisa verificar domínio');
    console.log('   • Acesse: https://app.mailersend.com/domains');
    console.log('   • Verifique o domínio test-q3enl6kv8v14kj50.mlsender.net');
    console.log('');
    console.log('2. 🆓 SMTP2GO - 1000 emails gratuitos/mês');
    console.log('   • Registre-se: https://www.smtp2go.com/');
    console.log('   • Configure credenciais no código');
    console.log('');
    console.log('3. 📮 Sendinblue/Brevo - Gratuito até 300 emails/dia');
    console.log('   • Registre-se: https://www.brevo.com/');
    console.log('   • Configure SMTP ou API');
    console.log('');
    console.log('4. ✉️ Ethereal Email - Para preview completo');
    console.log('   • Acesse: https://ethereal.email/message/aKTBMUtUvPQAxUz.aKTBNTr3pD0h9o-8AAAAAXutJg9MfGmL8nAdrVCYocA');
    console.log('   • Veja exatamente como o email ficará');
  }
}

sendViaSmtp2Go();