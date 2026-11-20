package com.pagwave.android.ui.state

import android.Manifest
import android.app.Application
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pagwave.android.MainActivity
import com.pagwave.android.PagwaveApplication
import com.pagwave.android.R
import com.pagwave.android.core.i18n.PagwaveLocale
import com.pagwave.android.core.model.*
import com.pagwave.android.data.PagwaveRepository
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject

data class AppUiState(
    val checkingSession: Boolean = true,
    val isAuthenticated: Boolean = false,
    val darkTheme: Boolean = true,
    val locale: PagwaveLocale = PagwaveLocale.PT,

    // Auth
    val authLoading: Boolean = false,
    val authRequires2FA: Boolean = false,
    val authError: String? = null,
    val authNotice: String? = null,

    // Dashboard & Data
    val loadingData: Boolean = false,
    val summary: DashboardSummaryResponse = DashboardSummaryResponse(),
    val wallets: WalletBalanceResponse = WalletBalanceResponse(),
    val selectedPeriod: String = "this-month",
    val statistic: StatisticResponse = StatisticResponse(),
    val recentSales: List<SaleDto> = emptyList(),
    val transactions: List<TransactionDto> = emptyList(),
    val beneficiaries: List<BeneficiaryDto> = emptyList(),
    val integrations: IntegrationsResponse = IntegrationsResponse(),
    val revealedApiSecret: String? = null,

    // Profile, Security & Notifications
    val profileEmail: String = "",
    val twoFactorEnabled: Boolean = false,
    val emailVerified: Boolean = false,
    val profile: UserProfileDto? = null,
    val preferences: NotificationPreferencesDto = NotificationPreferencesDto(),
    val notifications: List<NotificationItemDto> = emptyList(),
    val unreadCount: Int = 0,

    // Wallet Operations feedback
    val walletBusy: Boolean = false,
    val cashinResult: CashinResponse? = null,
    val fxSimulation: JsonObject? = null,
    val twoFactorSetup: TwoFactorSetupResponse? = null,

    // Global banner / snackbar
    val bannerMessage: String? = null,
    val bannerIsError: Boolean = false,
)

class AppViewModel(application: Application) : AndroidViewModel(application) {
    private val app = application as PagwaveApplication
    private val repo: PagwaveRepository = app.repository
    private var lastSeenTopNotificationId: String? = null
    private var pollingJob: Job? = null

    private val _state = MutableStateFlow(
        AppUiState(
            darkTheme = app.uiPrefs.darkTheme,
            locale = app.uiPrefs.locale,
        ),
    )
    val state: StateFlow<AppUiState> = _state.asStateFlow()

    init {
        repo.setSessionExpiredListener {
            viewModelScope.launch {
                pollingJob?.cancel()
                pollingJob = null
                _state.value = AppUiState(
                    checkingSession = false,
                    isAuthenticated = false,
                    darkTheme = app.uiPrefs.darkTheme,
                    locale = app.uiPrefs.locale,
                    authNotice = "Sua sessão expirou. Faça login novamente.",
                )
            }
        }
        bootstrap()
    }

    private fun bootstrap() {
        viewModelScope.launch {
            if (!repo.hasSavedSession()) {
                _state.update { it.copy(checkingSession = false, isAuthenticated = false) }
                return@launch
            }
            val summaryRes = repo.fetchDashboardSummary()
            if (summaryRes.isSuccess) {
                _state.update {
                    it.copy(
                        checkingSession = false,
                        isAuthenticated = true,
                        summary = summaryRes.getOrThrow(),
                    )
                }
                refreshAll()
                startNotificationPolling()
            } else {
                repo.clearSession()
                _state.update { it.copy(checkingSession = false, isAuthenticated = false) }
            }
        }
    }

    private fun startNotificationPolling() {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                delay(25_000)
                if (!_state.value.isAuthenticated) break
                repo.fetchNotifications().onSuccess { notif ->
                    handleIncomingNotifications(notif)
                    _state.update {
                        it.copy(
                            notifications = notif.notifications,
                            unreadCount = notif.unreadCount,
                        )
                    }
                }
            }
        }
    }

    private fun handleIncomingNotifications(notif: NotificationsResponse) {
        if (notif.notifications.isNotEmpty()) {
            val newest = notif.notifications.first()
            if (lastSeenTopNotificationId != null &&
                lastSeenTopNotificationId != newest.id &&
                !newest.isRead
            ) {
                postSystemNotification(newest.title, newest.body)
            }
            lastSeenTopNotificationId = newest.id
        }
    }

    fun toggleTheme() {
        val next = !_state.value.darkTheme
        app.uiPrefs.darkTheme = next
        _state.update { it.copy(darkTheme = next) }
    }

    fun setLocale(newLocale: PagwaveLocale) {
        app.uiPrefs.locale = newLocale
        _state.update { it.copy(locale = newLocale) }
        if (_state.value.isAuthenticated) {
            viewModelScope.launch {
                repo.setLocale(newLocale.code)
            }
        }
    }

    fun clearBanner() {
        _state.update { it.copy(bannerMessage = null, bannerIsError = false) }
    }

    private fun showBanner(message: String, isError: Boolean = false) {
        _state.update { it.copy(bannerMessage = message, bannerIsError = isError) }
    }

    // ─── Auth ─────────────────────────────────────────────────────────────

    fun login(email: String, password: String, twoFactorCode: String?) {
        viewModelScope.launch {
            _state.update { it.copy(authLoading = true, authError = null, authNotice = null) }
            val res = repo.login(email, password, twoFactorCode)
            res.fold(
                onSuccess = { body ->
                    if (body.requiresTwoFactor) {
                        _state.update {
                            it.copy(
                                authLoading = false,
                                authRequires2FA = true,
                                authNotice = "Informe o código de 6 dígitos do seu autenticador.",
                            )
                        }
                    } else {
                        _state.update {
                            it.copy(
                                authLoading = false,
                                authRequires2FA = false,
                                isAuthenticated = true,
                            )
                        }
                        refreshAll()
                        startNotificationPolling()
                    }
                },
                onFailure = { err ->
                    _state.update {
                        it.copy(
                            authLoading = false,
                            authError = err.message ?: "Credenciais inválidas.",
                        )
                    }
                },
            )
        }
    }

    fun register(
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        accountType: String,
        companyName: String?,
    ) {
        viewModelScope.launch {
            _state.update { it.copy(authLoading = true, authError = null, authNotice = null) }
            val res = repo.register(firstName, lastName, email, password, accountType, companyName)
            res.fold(
                onSuccess = {
                    _state.update {
                        it.copy(
                            authLoading = false,
                            isAuthenticated = true,
                        )
                    }
                    refreshAll()
                    startNotificationPolling()
                },
                onFailure = { err ->
                    _state.update {
                        it.copy(
                            authLoading = false,
                            authError = err.message ?: "Não foi possível criar a conta.",
                        )
                    }
                },
            )
        }
    }

    fun forgotPassword(email: String) {
        viewModelScope.launch {
            _state.update { it.copy(authLoading = true, authError = null, authNotice = null) }
            val res = repo.forgotPassword(email)
            res.fold(
                onSuccess = {
                    _state.update {
                        it.copy(
                            authLoading = false,
                            authNotice = "Se o e-mail existir, enviamos um link de redefinição.",
                        )
                    }
                },
                onFailure = { err ->
                    _state.update {
                        it.copy(authLoading = false, authError = err.message)
                    }
                },
            )
        }
    }

    fun resetAuthMessages() {
        _state.update { it.copy(authError = null, authNotice = null, authRequires2FA = false) }
    }

    fun logout() {
        viewModelScope.launch {
            pollingJob?.cancel()
            pollingJob = null
            repo.logout()
            lastSeenTopNotificationId = null
            _state.value = AppUiState(
                checkingSession = false,
                isAuthenticated = false,
                darkTheme = app.uiPrefs.darkTheme,
                locale = app.uiPrefs.locale,
            )
        }
    }

    fun logoutAllSessions() {
        viewModelScope.launch {
            pollingJob?.cancel()
            pollingJob = null
            repo.securityAction(SecurityActionRequest(action = "logout-all"))
            repo.clearSession()
            lastSeenTopNotificationId = null
            _state.value = AppUiState(
                checkingSession = false,
                isAuthenticated = false,
                darkTheme = app.uiPrefs.darkTheme,
                locale = app.uiPrefs.locale,
                authNotice = "Todas as sessões ativas foram encerradas.",
            )
        }
    }

    // ─── Data Sync ────────────────────────────────────────────────────────

    fun refreshAll() {
        viewModelScope.launch {
            _state.update { it.copy(loadingData = true) }
            val period = _state.value.selectedPeriod
            val sumDef = async { repo.fetchDashboardSummary() }
            val walDef = async { repo.fetchWallets() }
            val statDef = async { repo.fetchStatistic(period) }
            val salesDef = async { repo.fetchRecentSales() }
            val txDef = async { repo.fetchTransactions(100) }
            val notifDef = async { repo.fetchNotifications() }
            val profDef = async { repo.fetchProfile() }
            val benDef = async { repo.fetchBeneficiaries() }
            val intDef = async { repo.fetchIntegrations(reveal = false) }

            val sum = sumDef.await().getOrNull()
            val wal = walDef.await().getOrNull()
            val stat = statDef.await().getOrNull()
            val sales = salesDef.await().getOrNull()?.sales
            val txs = txDef.await().getOrNull()?.transactions
            val notif = notifDef.await().getOrNull()
            val prof = profDef.await().getOrNull()
            val bens = benDef.await().getOrNull()?.beneficiaries
            val integ = intDef.await().getOrNull()

            if (notif != null) {
                handleIncomingNotifications(notif)
            }

            if (prof?.locale != null) {
                val syncedLoc = PagwaveLocale.fromCode(prof.locale)
                if (syncedLoc != _state.value.locale) {
                    app.uiPrefs.locale = syncedLoc
                }
            }

            _state.update { cur ->
                cur.copy(
                    loadingData = false,
                    locale = prof?.locale?.let { PagwaveLocale.fromCode(it) } ?: cur.locale,
                    summary = sum ?: cur.summary,
                    wallets = wal ?: cur.wallets,
                    statistic = stat ?: cur.statistic,
                    recentSales = sales ?: cur.recentSales,
                    transactions = txs ?: cur.transactions,
                    notifications = notif?.notifications ?: cur.notifications,
                    unreadCount = notif?.unreadCount ?: cur.unreadCount,
                    profileEmail = prof?.email?.takeIf { it.isNotBlank() } ?: cur.profileEmail,
                    twoFactorEnabled = prof?.twoFactorEnabled ?: cur.twoFactorEnabled,
                    emailVerified = prof?.emailVerified ?: cur.emailVerified,
                    profile = prof?.profile ?: cur.profile,
                    preferences = prof?.preferences ?: cur.preferences,
                    beneficiaries = bens ?: cur.beneficiaries,
                    integrations = integ ?: cur.integrations,
                )
            }
        }
    }

    fun selectPeriod(period: String) {
        _state.update { it.copy(selectedPeriod = period) }
        viewModelScope.launch {
            repo.fetchStatistic(period).onSuccess { stat ->
                _state.update { it.copy(statistic = stat) }
            }
        }
    }

    // ─── Wallet Actions ───────────────────────────────────────────────────

    fun createDeposit(
        currency: String,
        method: String,
        mode: String,
        amount: Double?,
        payer: Map<String, String>,
    ) {
        viewModelScope.launch {
            _state.update { it.copy(walletBusy = true, cashinResult = null) }
            val res = repo.createCashin(
                CashinRequest(
                    purpose = "self_deposit",
                    currency = currency,
                    method = method,
                    mode = mode,
                    amount = if (mode == "static") null else amount,
                    payer = payer.filterValues { it.isNotBlank() },
                ),
            )
            res.fold(
                onSuccess = { body ->
                    _state.update { it.copy(walletBusy = false, cashinResult = body) }
                    showBanner("Cobrança de depósito criada em $currency.")
                    refreshAll()
                },
                onFailure = { err ->
                    _state.update { it.copy(walletBusy = false) }
                    showBanner(err.message ?: "Erro ao criar depósito.", isError = true)
                },
            )
        }
    }

    fun simulateSandboxCashin(requestNumber: String) {
        viewModelScope.launch {
            _state.update { it.copy(walletBusy = true) }
            repo.simulateSandboxPayment(requestNumber, "paid").fold(
                onSuccess = {
                    _state.update { it.copy(walletBusy = false) }
                    showBanner("Pagamento Sandbox liquidado na sua carteira!")
                    refreshAll()
                },
                onFailure = { err ->
                    _state.update { it.copy(walletBusy = false) }
                    showBanner(err.message ?: "Falha na simulação sandbox.", isError = true)
                },
            )
        }
    }

    fun sendP2P(currency: String, recipientEmail: String, amount: Double, description: String) {
        viewModelScope.launch {
            _state.update { it.copy(walletBusy = true) }
            val res = repo.createTransfer(
                TransferRequest(
                    currency = currency,
                    recipientEmail = recipientEmail.trim(),
                    amount = amount,
                    description = description.trim().takeIf { it.isNotBlank() },
                ),
            )
            res.fold(
                onSuccess = { body ->
                    _state.update { it.copy(walletBusy = false) }
                    val ref = body.transfer?.referenceId.orEmpty()
                    showBanner("Transferência P2P enviada com sucesso ($ref).")
                    refreshAll()
                },
                onFailure = { err ->
                    _state.update { it.copy(walletBusy = false) }
                    showBanner(err.message ?: "Falha na transferência P2P.", isError = true)
                },
            )
        }
    }

    fun simulateConversion(from: String, to: String, amount: Double) {
        viewModelScope.launch {
            _state.update { it.copy(walletBusy = true, fxSimulation = null) }
            val res = repo.convert(ConversionRequest("simulate", from, to, amount))
            res.fold(
                onSuccess = { body ->
                    _state.update { it.copy(walletBusy = false, fxSimulation = body.simulation) }
                },
                onFailure = { err ->
                    _state.update { it.copy(walletBusy = false) }
                    showBanner(err.message ?: "Erro ao simular cotação.", isError = true)
                },
            )
        }
    }

    fun executeConversion(from: String, to: String, amount: Double) {
        viewModelScope.launch {
            _state.update { it.copy(walletBusy = true) }
            val res = repo.convert(ConversionRequest("execute", from, to, amount))
            res.fold(
                onSuccess = {
                    _state.update { it.copy(walletBusy = false, fxSimulation = null) }
                    showBanner("Conversão $from → $to executada com sucesso.")
                    refreshAll()
                },
                onFailure = { err ->
                    _state.update { it.copy(walletBusy = false) }
                    showBanner(err.message ?: "Falha na conversão.", isError = true)
                },
            )
        }
    }

    fun requestWithdraw(
        beneficiaryId: String?,
        currency: String,
        rail: String,
        details: Map<String, String>,
        amount: Double,
        description: String,
    ) {
        viewModelScope.launch {
            _state.update { it.copy(walletBusy = true) }
            val req = if (!beneficiaryId.isNullOrBlank()) {
                CashoutRequest(
                    beneficiaryId = beneficiaryId,
                    amount = amount,
                    description = description.trim().takeIf { it.isNotBlank() },
                )
            } else {
                CashoutRequest(
                    currency = currency,
                    rail = rail,
                    details = details.mapValues { it.value.trim() }.filterValues { it.isNotBlank() },
                    amount = amount,
                    description = description.trim().takeIf { it.isNotBlank() },
                )
            }
            val res = repo.createCashout(req)
            res.fold(
                onSuccess = { body ->
                    _state.update { it.copy(walletBusy = false) }
                    showBanner("Saque enviado para processamento (${body.externalId}).")
                    refreshAll()
                },
                onFailure = { err ->
                    _state.update { it.copy(walletBusy = false) }
                    showBanner(err.message ?: "Erro ao solicitar saque.", isError = true)
                },
            )
        }
    }

    fun saveBeneficiary(label: String, currency: String, rail: String, details: Map<String, String>) {
        viewModelScope.launch {
            _state.update { it.copy(walletBusy = true) }
            val res = repo.createBeneficiary(
                CreateBeneficiaryRequest(
                    label = label.trim(),
                    currency = currency,
                    rail = rail,
                    details = details.mapValues { it.value.trim() }.filterValues { it.isNotBlank() },
                ),
            )
            res.fold(
                onSuccess = {
                    _state.update { it.copy(walletBusy = false) }
                    showBanner("Beneficiário salvo no banco.")
                    refreshAll()
                },
                onFailure = { err ->
                    _state.update { it.copy(walletBusy = false) }
                    showBanner(err.message ?: "Não foi possível salvar o beneficiário.", isError = true)
                },
            )
        }
    }

    fun deleteBeneficiary(id: String) {
        viewModelScope.launch {
            repo.deleteBeneficiary(id).onSuccess {
                showBanner("Beneficiário removido.")
                refreshAll()
            }
        }
    }

    // ─── Integrations ─────────────────────────────────────────────────────

    fun revealApiSecret() {
        viewModelScope.launch {
            repo.fetchIntegrations(reveal = true).fold(
                onSuccess = { res ->
                    _state.update {
                        it.copy(
                            integrations = res,
                            revealedApiSecret = res.credential?.secret,
                        )
                    }
                },
                onFailure = { err -> showBanner(err.message ?: "Erro ao revelar chave.", isError = true) },
            )
        }
    }

    fun saveIntegrationConfig(label: String, webhookUrl: String) {
        viewModelScope.launch {
            repo.updateIntegrationConfig(label, webhookUrl).fold(
                onSuccess = { res ->
                    _state.update { cur ->
                        cur.copy(
                            integrations = cur.integrations.copy(credential = res.credential ?: cur.integrations.credential),
                        )
                    }
                    showBanner("Webhook e nome da chave salvos.")
                },
                onFailure = { err -> showBanner(err.message ?: "Erro ao salvar webhook.", isError = true) },
            )
        }
    }

    fun rotateApiKey() {
        viewModelScope.launch {
            repo.rotateApiKey().fold(
                onSuccess = { res ->
                    _state.update { cur ->
                        cur.copy(
                            integrations = cur.integrations.copy(credential = res.credential ?: cur.integrations.credential),
                            revealedApiSecret = res.credential?.secret,
                        )
                    }
                    showBanner("Chaves da API rotacionadas com segurança.")
                },
                onFailure = { err -> showBanner(err.message ?: "Erro ao rotacionar chaves.", isError = true) },
            )
        }
    }

    // ─── Notifications & Settings ─────────────────────────────────────────

    fun markNotificationRead(id: String) {
        _state.update { cur ->
            val updated = cur.notifications.map { if (it.id == id) it.copy(isRead = true) else it }
            cur.copy(
                notifications = updated,
                unreadCount = updated.count { !it.isRead },
            )
        }
        viewModelScope.launch { repo.markNotificationRead(id) }
    }

    fun markAllNotificationsRead() {
        _state.update { cur ->
            cur.copy(
                notifications = cur.notifications.map { it.copy(isRead = true) },
                unreadCount = 0,
            )
        }
        viewModelScope.launch { repo.markAllNotificationsRead() }
    }

    fun triggerTestNotification() {
        viewModelScope.launch {
            repo.sendTestNotification().fold(
                onSuccess = {
                    postSystemNotification(
                        "Alerta pagwave ativo!",
                        "Suas notificações em tempo real no aplicativo Android estão funcionando.",
                    )
                    showBanner("Alerta de teste disparado!")
                    refreshAll()
                },
                onFailure = { err ->
                    showBanner(err.message ?: "Falha ao enviar teste.", isError = true)
                },
            )
        }
    }

    fun triggerWeeklyDigest() {
        viewModelScope.launch {
            repo.sendWeeklyDigest().fold(
                onSuccess = {
                    showBanner("Resumo semanal consolidado gerado e enviado!")
                    refreshAll()
                },
                onFailure = { err ->
                    showBanner(err.message ?: "Falha ao gerar resumo semanal.", isError = true)
                },
            )
        }
    }

    fun updatePreference(updated: NotificationPreferencesDto) {
        _state.update { it.copy(preferences = updated) }
        viewModelScope.launch {
            repo.updateProfile(ProfilePatchRequest(preferences = updated)).fold(
                onSuccess = { showBanner("Preferência salva.") },
                onFailure = { err -> showBanner(err.message ?: "Falha ao salvar preferência.", isError = true) },
            )
        }
    }

    fun saveProfile(firstName: String, lastName: String, phone: String, country: String, companyName: String) {
        viewModelScope.launch {
            _state.update { it.copy(walletBusy = true) }
            repo.updateProfile(
                ProfilePatchRequest(
                    firstName = firstName.trim(),
                    lastName = lastName.trim(),
                    phone = phone.trim(),
                    country = country.trim().uppercase(),
                    companyName = companyName.trim(),
                ),
            ).fold(
                onSuccess = {
                    _state.update { it.copy(walletBusy = false) }
                    showBanner("Perfil atualizado no PostgreSQL.")
                    refreshAll()
                },
                onFailure = { err ->
                    _state.update { it.copy(walletBusy = false) }
                    showBanner(err.message ?: "Erro ao atualizar perfil.", isError = true)
                },
            )
        }
    }

    fun changePassword(current: String, next: String) {
        viewModelScope.launch {
            repo.securityAction(
                SecurityActionRequest(
                    action = "change-password",
                    currentPassword = current,
                    newPassword = next,
                ),
            ).fold(
                onSuccess = { showBanner("Senha alterada com sucesso.") },
                onFailure = { err -> showBanner(err.message ?: "Erro ao alterar senha.", isError = true) },
            )
        }
    }

    fun setup2FA() {
        viewModelScope.launch {
            repo.setupTwoFactor().fold(
                onSuccess = { res -> _state.update { it.copy(twoFactorSetup = res) } },
                onFailure = { err -> showBanner(err.message ?: "Erro ao iniciar 2FA.", isError = true) },
            )
        }
    }

    fun confirm2FA(code: String) {
        viewModelScope.launch {
            repo.securityAction(SecurityActionRequest(action = "2fa-confirm", code = code)).fold(
                onSuccess = {
                    _state.update { it.copy(twoFactorSetup = null, twoFactorEnabled = true) }
                    showBanner("Autenticação 2FA ativada!")
                    refreshAll()
                },
                onFailure = { err -> showBanner(err.message ?: "Código 2FA inválido.", isError = true) },
            )
        }
    }

    fun disable2FA(password: String) {
        viewModelScope.launch {
            repo.securityAction(SecurityActionRequest(action = "2fa-disable", password = password)).fold(
                onSuccess = {
                    _state.update { it.copy(twoFactorEnabled = false, twoFactorSetup = null) }
                    showBanner("Autenticação 2FA desativada.")
                    refreshAll()
                },
                onFailure = { err -> showBanner(err.message ?: "Não foi possível desativar 2FA.", isError = true) },
            )
        }
    }

    private fun postSystemNotification(title: String, body: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                app,
                Manifest.permission.POST_NOTIFICATIONS,
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) return
        }
        val intent = Intent(app, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pi = PendingIntent.getActivity(
            app,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val notif = NotificationCompat.Builder(app, PagwaveApplication.ALERT_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .build()

        NotificationManagerCompat.from(app).notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), notif)
    }
}
