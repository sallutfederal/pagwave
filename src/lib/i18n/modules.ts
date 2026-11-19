import type { Locale } from "@/lib/i18n/types";

export type ModuleMessages = {
  cashin: {
    depositTitle: string;
    depositSubtitle: string;
    chargeTitle: string;
    chargeSubtitle: string;
    purposeSelf: string;
    purposeCharge: string;
    currencyLabel: string;
    methodLabel: string;
    modeLabel: string;
    modeDynamic: string;
    modeStatic: string;
    amountLabel: string;
    openAmount: string;
    descLabel: string;
    submitDeposit: string;
    submitCharge: string;
    submitting: string;
    sandboxSimulate: string;
    simulating: string;
    copyCode: string;
    copied: string;
    paidNotice: string;
  };
  cashout: {
    title: string;
    subtitle: string;
    sourceSaved: string;
    sourceAdhoc: string;
    savedLabel: string;
    currencyLabel: string;
    railLabel: string;
    amountLabel: string;
    availablePrefix: string;
    descLabel: string;
    saveBeneficiaryLabel: string;
    submit: string;
    submitting: string;
  };
  beneficiaries: {
    formTitle: string;
    listTitle: string;
    empty: string;
    submit: string;
    useForWithdraw: string;
    setDefault: string;
    defaultBadge: string;
  };
  conversion: {
    title: string;
    subtitle: string;
    fromLabel: string;
    toLabel: string;
    amountLabel: string;
    simulateBtn: string;
    executeBtn: string;
    lookupTitle: string;
    historyTitle: string;
    historyEmpty: string;
    webhooksTitle: string;
    webhooksEmpty: string;
  };
  integrations: {
    credentialsTitle: string;
    rotateBtn: string;
    revealBtn: string;
    hideBtn: string;
    webhookSaveBtn: string;
    testTitle: string;
    logsTitle: string;
    logsEmpty: string;
    docsLink: string;
  };
  settings: {
    profileTitle: string;
    kycTitle: string;
    kycSubmitBtn: string;
    securityTitle: string;
    notificationsTitle: string;
    saveProfileBtn: string;
    saveNotificationsBtn: string;
    enable2faBtn: string;
    disable2faBtn: string;
    changePasswordBtn: string;
  };
  admin: {
    overviewNav: string;
    usersNav: string;
    txNav: string;
    integrationsNav: string;
    settingsNav: string;
  };
};

export const MODULE_MESSAGES: Record<Locale, ModuleMessages> = {
  pt: {
    cashin: {
      depositTitle: "Depositar na minha conta",
      depositSubtitle: "Gere um Pix ou transferência local e guarde saldo com segurança na sua carteira.",
      chargeTitle: "Gerar Cobrança / Link de Recebimento",
      chargeSubtitle: "Receba pagamentos via Pix, SPEI, PSE, CBU, QR e outros trilhos locais.",
      purposeSelf: "Depositar na conta",
      purposeCharge: "Cobrança de cliente",
      currencyLabel: "Moeda",
      methodLabel: "Método",
      modeLabel: "Tipo",
      modeDynamic: "Valor fixo",
      modeStatic: "Valor aberto (estático)",
      amountLabel: "Valor",
      openAmount: "Valor aberto",
      descLabel: "Descrição",
      submitDeposit: "Gerar depósito",
      submitCharge: "Gerar cobrança",
      submitting: "Gerando...",
      sandboxSimulate: "Simular pagamento (Sandbox)",
      simulating: "Simulando...",
      copyCode: "Copiar código",
      copied: "Copiado",
      paidNotice: "Pagamento confirmado e saldo atualizado!",
    },
    cashout: {
      title: "Solicitar Saque (Cash-out)",
      subtitle: "Envie recursos da sua carteira para Pix, contas bancárias locais ou redes USDT/USDC.",
      sourceSaved: "Chave / carteira salva",
      sourceAdhoc: "Novo destino avulso",
      savedLabel: "Destino salvo",
      currencyLabel: "Moeda",
      railLabel: "Trilho / Rede",
      amountLabel: "Valor do saque",
      availablePrefix: "Disponível",
      descLabel: "Identificação (opcional)",
      saveBeneficiaryLabel: "Salvar destino para próximos saques",
      submit: "Enviar saque",
      submitting: "Enviando...",
    },
    beneficiaries: {
      formTitle: "Cadastrar Chave Pix ou Endereço Cripto",
      listTitle: "Chaves e Carteiras Salvas",
      empty: "Nenhuma chave ou endereço salvo ainda.",
      submit: "Salvar destino",
      useForWithdraw: "Sacar para este destino",
      setDefault: "Definir padrão",
      defaultBadge: "Padrão",
    },
    conversion: {
      title: "Conversão Instantânea (FX)",
      subtitle: "Simule a cotação em tempo real e converta saldo entre moedas suportadas.",
      fromLabel: "De",
      toLabel: "Para",
      amountLabel: "Valor a converter",
      simulateBtn: "Simular cotação",
      executeBtn: "Executar conversão",
      lookupTitle: "Consulta Direta na API XPag",
      historyTitle: "Histórico recente desta conta",
      historyEmpty: "Nenhuma movimentação registrada ainda nesta carteira.",
      webhooksTitle: "Webhooks Recebidos",
      webhooksEmpty: "Nenhum evento de webhook registrado ainda.",
    },
    integrations: {
      credentialsTitle: "Credenciais PagWave API",
      rotateBtn: "Rotacionar chave",
      revealBtn: "Revelar secret",
      hideBtn: "Ocultar",
      webhookSaveBtn: "Salvar webhook",
      testTitle: "Testar chamada da API",
      logsTitle: "Logs recentes de chamadas",
      logsEmpty: "Nenhuma requisição registrada ainda.",
      docsLink: "Abrir documentação",
    },
    settings: {
      profileTitle: "Dados do Perfil",
      kycTitle: "Verificação de Identidade (KYC)",
      kycSubmitBtn: "Enviar documento KYC",
      securityTitle: "Segurança & Autenticação (2FA / Senha)",
      notificationsTitle: "Preferências de Notificações",
      saveProfileBtn: "Salvar perfil",
      saveNotificationsBtn: "Salvar preferências",
      enable2faBtn: "Ativar 2FA",
      disable2faBtn: "Desativar 2FA",
      changePasswordBtn: "Alterar senha",
    },
    admin: {
      overviewNav: "Visão Geral",
      usersNav: "Usuários & KYC",
      txNav: "Transações & MED",
      integrationsNav: "API Keys & Webhooks",
      settingsNav: "Configurações & Moedas",
    },
  },
  en: {
    cashin: {
      depositTitle: "Deposit to my account",
      depositSubtitle: "Generate a Pix or local transfer to safely fund and hold balance in your wallet.",
      chargeTitle: "Create Payment / Receive Charge",
      chargeSubtitle: "Accept payments via Pix, SPEI, PSE, CBU, QR and other local rails.",
      purposeSelf: "Self deposit",
      purposeCharge: "Customer charge",
      currencyLabel: "Currency",
      methodLabel: "Method",
      modeLabel: "Mode",
      modeDynamic: "Fixed amount",
      modeStatic: "Open amount (static)",
      amountLabel: "Amount",
      openAmount: "Open amount",
      descLabel: "Description",
      submitDeposit: "Create deposit",
      submitCharge: "Create charge",
      submitting: "Creating...",
      sandboxSimulate: "Simulate payment (Sandbox)",
      simulating: "Simulating...",
      copyCode: "Copy code",
      copied: "Copied",
      paidNotice: "Payment confirmed and balance updated!",
    },
    cashout: {
      title: "Request Withdrawal (Cash-out)",
      subtitle: "Send funds from your wallet to Pix, local bank accounts or USDT/USDC networks.",
      sourceSaved: "Saved key / wallet",
      sourceAdhoc: "New one-time destination",
      savedLabel: "Saved destination",
      currencyLabel: "Currency",
      railLabel: "Rail / Network",
      amountLabel: "Withdrawal amount",
      availablePrefix: "Available",
      descLabel: "Reference note (optional)",
      saveBeneficiaryLabel: "Save destination for future withdrawals",
      submit: "Send withdrawal",
      submitting: "Sending...",
    },
    beneficiaries: {
      formTitle: "Save Pix Key or Crypto Address",
      listTitle: "Saved Keys & Wallets",
      empty: "No saved keys or addresses yet.",
      submit: "Save destination",
      useForWithdraw: "Withdraw to this target",
      setDefault: "Set default",
      defaultBadge: "Default",
    },
    conversion: {
      title: "Instant FX Conversion",
      subtitle: "Preview real-time quotes and convert balances between supported currencies.",
      fromLabel: "From",
      toLabel: "To",
      amountLabel: "Amount to convert",
      simulateBtn: "Preview quote",
      executeBtn: "Execute conversion",
      lookupTitle: "Direct XPag API Lookup",
      historyTitle: "Recent account activity",
      historyEmpty: "No activity recorded in this wallet yet.",
      webhooksTitle: "Received Webhooks",
      webhooksEmpty: "No webhook events recorded yet.",
    },
    integrations: {
      credentialsTitle: "PagWave API Credentials",
      rotateBtn: "Rotate key",
      revealBtn: "Reveal secret",
      hideBtn: "Hide",
      webhookSaveBtn: "Save webhook",
      testTitle: "Test API Request",
      logsTitle: "Recent API request logs",
      logsEmpty: "No API requests recorded yet.",
      docsLink: "Open docs",
    },
    settings: {
      profileTitle: "Profile Information",
      kycTitle: "Identity Verification (KYC)",
      kycSubmitBtn: "Submit KYC document",
      securityTitle: "Security & Authentication (2FA / Password)",
      notificationsTitle: "Notification Preferences",
      saveProfileBtn: "Save profile",
      saveNotificationsBtn: "Save preferences",
      enable2faBtn: "Enable 2FA",
      disable2faBtn: "Disable 2FA",
      changePasswordBtn: "Change password",
    },
    admin: {
      overviewNav: "Overview",
      usersNav: "Users & KYC",
      txNav: "Transactions & MED",
      integrationsNav: "API Keys & Webhooks",
      settingsNav: "Settings & Currencies",
    },
  },
  es: {
    cashin: {
      depositTitle: "Depositar en mi cuenta",
      depositSubtitle: "Genera un Pix o transferencia local para fondear y guardar saldo en tu billetera.",
      chargeTitle: "Generar Cobro / Enlace de Pago",
      chargeSubtitle: "Recibe pagos vía Pix, SPEI, PSE, CBU, QR y otros rieles locales.",
      purposeSelf: "Depositar en cuenta",
      purposeCharge: "Cobro a cliente",
      currencyLabel: "Moneda",
      methodLabel: "Método",
      modeLabel: "Tipo",
      modeDynamic: "Monto fijo",
      modeStatic: "Monto abierto (estático)",
      amountLabel: "Monto",
      openAmount: "Monto abierto",
      descLabel: "Descripción",
      submitDeposit: "Generar depósito",
      submitCharge: "Generar cobro",
      submitting: "Generando...",
      sandboxSimulate: "Simular pago (Sandbox)",
      simulating: "Simulando...",
      copyCode: "Copiar código",
      copied: "Copiado",
      paidNotice: "¡Pago confirmado y saldo actualizado!",
    },
    cashout: {
      title: "Solicitar Retiro (Cash-out)",
      subtitle: "Envía fondos desde tu billetera a Pix, bancos locales o redes USDT/USDC.",
      sourceSaved: "Clave / billetera guardada",
      sourceAdhoc: "Nuevo destino único",
      savedLabel: "Destino guardado",
      currencyLabel: "Moneda",
      railLabel: "Riel / Red",
      amountLabel: "Monto del retiro",
      availablePrefix: "Disponible",
      descLabel: "Referencia (opcional)",
      saveBeneficiaryLabel: "Guardar destino para futuros retiros",
      submit: "Enviar retiro",
      submitting: "Enviando...",
    },
    beneficiaries: {
      formTitle: "Registrar Clave Pix o Dirección Cripto",
      listTitle: "Claves y Billeteras Guardadas",
      empty: "Aún no hay claves o direcciones guardadas.",
      submit: "Guardar destino",
      useForWithdraw: "Retirar a este destino",
      setDefault: "Fijar predeterminado",
      defaultBadge: "Predeterminado",
    },
    conversion: {
      title: "Conversión Instantánea (FX)",
      subtitle: "Cotiza en tiempo real y convierte saldo entre monedas compatibles.",
      fromLabel: "Desde",
      toLabel: "Hacia",
      amountLabel: "Monto a convertir",
      simulateBtn: "Simular cotización",
      executeBtn: "Ejecutar conversión",
      lookupTitle: "Consulta Directa en API XPag",
      historyTitle: "Historial reciente de la cuenta",
      historyEmpty: "Aún no hay movimientos registrados en esta billetera.",
      webhooksTitle: "Webhooks Recibidos",
      webhooksEmpty: "Aún no hay eventos webhook registrados.",
    },
    integrations: {
      credentialsTitle: "Credenciales PagWave API",
      rotateBtn: "Rotar clave",
      revealBtn: "Revelar secret",
      hideBtn: "Ocultar",
      webhookSaveBtn: "Guardar webhook",
      testTitle: "Probar llamada API",
      logsTitle: "Registros recientes de API",
      logsEmpty: "Aún no hay solicitudes registradas.",
      docsLink: "Abrir documentación",
    },
    settings: {
      profileTitle: "Datos del Perfil",
      kycTitle: "Verificación de Identidad (KYC)",
      kycSubmitBtn: "Enviar documento KYC",
      securityTitle: "Seguridad y Autenticación (2FA / Contraseña)",
      notificationsTitle: "Preferencias de Notificaciones",
      saveProfileBtn: "Guardar perfil",
      saveNotificationsBtn: "Guardar preferencias",
      enable2faBtn: "Activar 2FA",
      disable2faBtn: "Desactivar 2FA",
      changePasswordBtn: "Cambiar contraseña",
    },
    admin: {
      overviewNav: "Resumen",
      usersNav: "Usuarios y KYC",
      txNav: "Transacciones y MED",
      integrationsNav: "API Keys y Webhooks",
      settingsNav: "Configuración y Monedas",
    },
  },
  ar: {
    cashin: {
      depositTitle: "الإيداع في حسابي",
      depositSubtitle: "أنشئ رمز Pix أو تحويلاً محلياً لإضافة الرصيد وحفظه في محفظتك بأمان.",
      chargeTitle: "إنشاء طلب تحصيل",
      chargeSubtitle: "استقبل المدفوعات عبر Pix وSPEI وPSE وCBU وغيرها من الشبكات المحلية.",
      purposeSelf: "إيداع شخصي",
      purposeCharge: "تحصيل من عميل",
      currencyLabel: "العملة",
      methodLabel: "الطريقة",
      modeLabel: "النوع",
      modeDynamic: "مبلغ محدد",
      modeStatic: "مبلغ مفتوح (ثابت)",
      amountLabel: "المبلغ",
      openAmount: "مبلغ مفتوح",
      descLabel: "الوصف",
      submitDeposit: "إنشاء إيداع",
      submitCharge: "إنشاء طلب دفع",
      submitting: "جارٍ الإنشاء...",
      sandboxSimulate: "محاكاة الدفع (Sandbox)",
      simulating: "جارٍ المحاكاة...",
      copyCode: "نسخ الرمز",
      copied: "تم النسخ",
      paidNotice: "تم تأكيد الدفع وتحديث الرصيد!",
    },
    cashout: {
      title: "طلب سحب (Cash-out)",
      subtitle: "أرسل الأموال من محفظتك إلى Pix أو الحسابات البنكية المحلية أو شبكات USDT/USDC.",
      sourceSaved: "مفتاح / محفظة محفوظة",
      sourceAdhoc: "وجهة جديدة لمرة واحدة",
      savedLabel: "الوجهة المحفوظة",
      currencyLabel: "العملة",
      railLabel: "الشبكة / المسار",
      amountLabel: "مبلغ السحب",
      availablePrefix: "المتاح",
      descLabel: "ملاحظة مرجعية (اختياري)",
      saveBeneficiaryLabel: "حفظ الوجهة لعمليات السحب القادمة",
      submit: "إرسال السحب",
      submitting: "جارٍ الإرسال...",
    },
    beneficiaries: {
      formTitle: "حفظ مفتاح Pix أو عنوان رقمي",
      listTitle: "المفاتيح والمحافظ المحفوظة",
      empty: "لا توجد مفاتيح أو عناوين محفوظة بعد.",
      submit: "حفظ الوجهة",
      useForWithdraw: "السحب إلى هذه الوجهة",
      setDefault: "تعيين كافتراضي",
      defaultBadge: "افتراضي",
    },
    conversion: {
      title: "تحويل فوري للعملات (FX)",
      subtitle: "اعرض السعر الفوري وحوّل الرصيد بين العملات المدعومة.",
      fromLabel: "من",
      toLabel: "إلى",
      amountLabel: "المبلغ المراد تحويله",
      simulateBtn: "معاينة السعر",
      executeBtn: "تنفيذ التحويل",
      lookupTitle: "استعلام مباشر عبر XPag API",
      historyTitle: "أحدث حركات هذا الحساب",
      historyEmpty: "لا توجد حركات مسجلة في هذه المحفظة بعد.",
      webhooksTitle: "أحداث Webhook المستلمة",
      webhooksEmpty: "لا توجد أحداث Webhook مسجلة بعد.",
    },
    integrations: {
      credentialsTitle: "بيانات اعتماد PagWave API",
      rotateBtn: "تدوير المفتاح",
      revealBtn: "إظهار السر",
      hideBtn: "إخفاء",
      webhookSaveBtn: "حفظ Webhook",
      testTitle: "اختبار طلب API",
      logsTitle: "سجلات الطلبات الأخيرة",
      logsEmpty: "لا توجد طلبات API مسجلة بعد.",
      docsLink: "فتح الوثائق",
    },
    settings: {
      profileTitle: "بيانات الملف الشخصي",
      kycTitle: "التحقق من الهوية (KYC)",
      kycSubmitBtn: "إرسال مستند KYC",
      securityTitle: "الأمان والمصادقة (2FA / كلمة المرور)",
      notificationsTitle: "تفضيلات الإشعارات",
      saveProfileBtn: "حفظ الملف",
      saveNotificationsBtn: "حفظ التفضيلات",
      enable2faBtn: "تفعيل 2FA",
      disable2faBtn: "تعطيل 2FA",
      changePasswordBtn: "تغيير كلمة المرور",
    },
    admin: {
      overviewNav: "نظرة عامة",
      usersNav: "المستخدمون وKYC",
      txNav: "المعاملات وMED",
      integrationsNav: "مفاتيح API وWebhooks",
      settingsNav: "الإعدادات والعملات",
    },
  },
  fr: {
    cashin: {
      depositTitle: "Déposer sur mon compte",
      depositSubtitle: "Générez un Pix ou virement local pour approvisionner votre portefeuille.",
      chargeTitle: "Créer un Paiement / Lien d'encaissement",
      chargeSubtitle: "Recevez des paiements via Pix, SPEI, PSE, CBU, QR et autres réseaux locaux.",
      purposeSelf: "Dépôt personnel",
      purposeCharge: "Encaissement client",
      currencyLabel: "Devise",
      methodLabel: "Méthode",
      modeLabel: "Type",
      modeDynamic: "Montant fixe",
      modeStatic: "Montant libre (statique)",
      amountLabel: "Montant",
      openAmount: "Montant libre",
      descLabel: "Description",
      submitDeposit: "Créer le dépôt",
      submitCharge: "Créer le paiement",
      submitting: "Création...",
      sandboxSimulate: "Simuler le paiement (Sandbox)",
      simulating: "Simulation...",
      copyCode: "Copier le code",
      copied: "Copié",
      paidNotice: "Paiement confirmé et solde mis à jour !",
    },
    cashout: {
      title: "Demander un Retrait (Cash-out)",
      subtitle: "Envoyez des fonds vers Pix, banques locales ou réseaux USDT/USDC.",
      sourceSaved: "Clé / adresse enregistrée",
      sourceAdhoc: "Nouvelle destination",
      savedLabel: "Destination enregistrée",
      currencyLabel: "Devise",
      railLabel: "Réseau / Canal",
      amountLabel: "Montant du retrait",
      availablePrefix: "Disponible",
      descLabel: "Note de référence (optionnel)",
      saveBeneficiaryLabel: "Enregistrer cette destination",
      submit: "Envoyer le retrait",
      submitting: "Envoi...",
    },
    beneficiaries: {
      formTitle: "Ajouter une clé Pix ou adresse Crypto",
      listTitle: "Clés & Adresses enregistrées",
      empty: "Aucune clé ou adresse enregistrée.",
      submit: "Enregistrer",
      useForWithdraw: "Retirer vers cette destination",
      setDefault: "Par défaut",
      defaultBadge: "Défaut",
    },
    conversion: {
      title: "Conversion Instantanée (FX)",
      subtitle: "Simulez le taux en direct et convertissez vos devises.",
      fromLabel: "De",
      toLabel: "Vers",
      amountLabel: "Montant à convertir",
      simulateBtn: "Simuler le taux",
      executeBtn: "Exécuter la conversion",
      lookupTitle: "Recherche directe XPag API",
      historyTitle: "Historique récent de ce compte",
      historyEmpty: "Aucune activité enregistrée dans ce portefeuille.",
      webhooksTitle: "Webhooks Reçus",
      webhooksEmpty: "Aucun événement webhook enregistré.",
    },
    integrations: {
      credentialsTitle: "Identifiants PagWave API",
      rotateBtn: "Régénérer",
      revealBtn: "Afficher le secret",
      hideBtn: "Masquer",
      webhookSaveBtn: "Enregistrer le webhook",
      testTitle: "Tester l'API",
      logsTitle: "Journaux récents",
      logsEmpty: "Aucune requête enregistrée.",
      docsLink: "Documentation",
    },
    settings: {
      profileTitle: "Informations du Profil",
      kycTitle: "Vérification d'identité (KYC)",
      kycSubmitBtn: "Envoyer le document KYC",
      securityTitle: "Sécurité & Authentification (2FA / Mot de passe)",
      notificationsTitle: "Préférences de notifications",
      saveProfileBtn: "Enregistrer le profil",
      saveNotificationsBtn: "Enregistrer les préférences",
      enable2faBtn: "Activer 2FA",
      disable2faBtn: "Désactiver 2FA",
      changePasswordBtn: "Changer le mot de passe",
    },
    admin: {
      overviewNav: "Vue d'ensemble",
      usersNav: "Utilisateurs & KYC",
      txNav: "Transactions & MED",
      integrationsNav: "Clés API & Webhooks",
      settingsNav: "Paramètres & Devises",
    },
  },
  de: {
    cashin: {
      depositTitle: "Auf mein Konto einzahlen",
      depositSubtitle: "Erstellen Sie eine Pix- oder lokale Überweisung für Ihr Guthaben.",
      chargeTitle: "Zahlungsaufforderung erstellen",
      chargeSubtitle: "Zahlungen über Pix, SPEI, PSE, CBU, QR und lokale Netze empfangen.",
      purposeSelf: "Eigene Einzahlung",
      purposeCharge: "Kundenzahlung",
      currencyLabel: "Währung",
      methodLabel: "Methode",
      modeLabel: "Typ",
      modeDynamic: "Fester Betrag",
      modeStatic: "Offener Betrag (statisch)",
      amountLabel: "Betrag",
      openAmount: "Offener Betrag",
      descLabel: "Beschreibung",
      submitDeposit: "Einzahlung erstellen",
      submitCharge: "Zahlung erstellen",
      submitting: "Wird erstellt...",
      sandboxSimulate: "Zahlung simulieren (Sandbox)",
      simulating: "Simuliere...",
      copyCode: "Code kopieren",
      copied: "Kopiert",
      paidNotice: "Zahlung bestätigt und Guthaben aktualisiert!",
    },
    cashout: {
      title: "Auszahlung anfordern (Cash-out)",
      subtitle: "Geld an Pix, lokale Bankkonten oder USDT/USDC-Netzwerke senden.",
      sourceSaved: "Gespeichertes Ziel",
      sourceAdhoc: "Einmaliges Ziel",
      savedLabel: "Gespeichertes Ziel",
      currencyLabel: "Währung",
      railLabel: "Zahlungsweg / Netz",
      amountLabel: "Auszahlungsbetrag",
      availablePrefix: "Verfügbar",
      descLabel: "Verwendungszweck (optional)",
      saveBeneficiaryLabel: "Ziel für künftige Auszahlungen speichern",
      submit: "Auszahlung senden",
      submitting: "Wird gesendet...",
    },
    beneficiaries: {
      formTitle: "Pix-Schlüssel oder Krypto-Adresse speichern",
      listTitle: "Gespeicherte Ziele",
      empty: "Noch keine Ziele gespeichert.",
      submit: "Ziel speichern",
      useForWithdraw: "Hierhin auszahlen",
      setDefault: "Als Standard",
      defaultBadge: "Standard",
    },
    conversion: {
      title: "Sofort-Währungstausch (FX)",
      subtitle: "Echtzeitkurse prüfen und Guthaben umtauschen.",
      fromLabel: "Von",
      toLabel: "Nach",
      amountLabel: "Umzutauschender Betrag",
      simulateBtn: "Kurs prüfen",
      executeBtn: "Tausch ausführen",
      lookupTitle: "Direkte XPag API-Abfrage",
      historyTitle: "Aktuelle Kontoaktivität",
      historyEmpty: "Noch keine Bewegungen in dieser Wallet.",
      webhooksTitle: "Empfangene Webhooks",
      webhooksEmpty: "Noch keine Webhooks empfangen.",
    },
    integrations: {
      credentialsTitle: "PagWave API-Zugangsdaten",
      rotateBtn: "Schlüssel rotieren",
      revealBtn: "Secret anzeigen",
      hideBtn: "Ausblenden",
      webhookSaveBtn: "Webhook speichern",
      testTitle: "API-Anfrage testen",
      logsTitle: "Aktuelle API-Logs",
      logsEmpty: "Noch keine Anfragen protokolliert.",
      docsLink: "Dokumentation öffnen",
    },
    settings: {
      profileTitle: "Profildaten",
      kycTitle: "Identitätsprüfung (KYC)",
      kycSubmitBtn: "KYC-Dokument senden",
      securityTitle: "Sicherheit & Authentifizierung (2FA / Passwort)",
      notificationsTitle: "Benachrichtigungen",
      saveProfileBtn: "Profil speichern",
      saveNotificationsBtn: "Einstellungen speichern",
      enable2faBtn: "2FA aktivieren",
      disable2faBtn: "2FA deaktivieren",
      changePasswordBtn: "Passwort ändern",
    },
    admin: {
      overviewNav: "Überblick",
      usersNav: "Nutzer & KYC",
      txNav: "Transaktionen & MED",
      integrationsNav: "API-Keys & Webhooks",
      settingsNav: "Einstellungen & Währungen",
    },
  },
};
