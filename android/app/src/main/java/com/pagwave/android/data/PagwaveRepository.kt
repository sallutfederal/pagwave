package com.pagwave.android.data

import com.pagwave.android.core.model.*
import com.pagwave.android.core.network.PagwaveApiClient
import retrofit2.HttpException
import java.io.IOException

class PagwaveRepository(private val client: PagwaveApiClient) {
    private val api = client.api

    fun setSessionExpiredListener(listener: () -> Unit) {
        client.onSessionExpired = listener
    }

    fun hasSavedSession(): Boolean = client.cookieJar.hasActiveSession()

    fun clearSession() = client.cookieJar.clear()

    private inline fun <T> guard(block: () -> T): Result<T> {
        return try {
            Result.success(block())
        } catch (e: HttpException) {
            val raw = e.response()?.errorBody()?.string()
            val parsed = raw?.let {
                runCatching { client.json.decodeFromString<ApiErrorResponse>(it) }.getOrNull()
            }
            val msg = parsed?.message?.takeIf { it.isNotBlank() }
                ?: "Erro HTTP ${e.code()}"
            Result.failure(IllegalStateException(msg))
        } catch (_: IOException) {
            Result.failure(IllegalStateException("Sem conexão com o servidor. Verifique sua internet."))
        } catch (e: Exception) {
            Result.failure(IllegalStateException(e.message ?: "Erro inesperado."))
        }
    }

    suspend fun login(email: String, password: String, twoFactorCode: String? = null) = guard {
        api.login(LoginRequest(email.trim(), password, twoFactorCode?.takeIf { it.isNotBlank() }))
    }

    suspend fun register(
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        accountType: String,
        companyName: String?,
    ) = guard {
        api.register(
            RegisterRequest(
                firstName = firstName.trim(),
                lastName = lastName.trim(),
                email = email.trim(),
                password = password,
                accountType = accountType,
                companyName = companyName?.trim()?.takeIf { it.isNotBlank() },
            ),
        )
    }

    suspend fun forgotPassword(email: String) = guard {
        api.forgotPassword(ForgotPasswordRequest(email.trim()))
    }

    suspend fun logout() = guard {
        runCatching { api.logout() }
        client.cookieJar.clear()
        BasicOkResponse(ok = true)
    }

    suspend fun setLocale(localeCode: String) = guard {
        api.updateLocale(LocaleRequest(localeCode))
    }

    suspend fun fetchProfile() = guard { api.getProfile() }

    suspend fun updateProfile(patch: ProfilePatchRequest) = guard { api.patchProfile(patch) }

    suspend fun securityAction(req: SecurityActionRequest) = guard { api.securityAction(req) }

    suspend fun setupTwoFactor() = guard { api.setupTwoFactor(SecurityActionRequest(action = "2fa-setup")) }

    suspend fun fetchDashboardSummary() = guard { api.getDashboardSummary() }

    suspend fun fetchStatistic(period: String) = guard { api.getStatistic(period) }

    suspend fun fetchRecentSales() = guard { api.getRecentSales() }

    suspend fun fetchTransactions(limit: Int = 100) = guard { api.getDashboardTransactions(limit) }

    suspend fun fetchWallets() = guard { api.getWalletBalances() }

    suspend fun createCashin(req: CashinRequest) = guard { api.createCashin(req) }

    suspend fun simulateSandboxPayment(requestNumber: String, status: String = "paid") = guard {
        api.simulateSandbox(SandboxSimulateRequest(requestNumber = requestNumber, status = status))
    }

    suspend fun createTransfer(req: TransferRequest) = guard { api.createTransfer(req) }

    suspend fun convert(req: ConversionRequest) = guard { api.conversion(req) }

    suspend fun createCashout(req: CashoutRequest) = guard { api.createCashout(req) }

    suspend fun fetchBeneficiaries() = guard { api.getBeneficiaries() }

    suspend fun createBeneficiary(req: CreateBeneficiaryRequest) = guard { api.createBeneficiary(req) }

    suspend fun deleteBeneficiary(id: String) = guard { api.deleteBeneficiary(id) }

    suspend fun fetchNotifications() = guard { api.getNotifications() }

    suspend fun markNotificationRead(id: String) = guard {
        api.notificationAction(NotificationActionRequest(action = "read", id = id))
    }

    suspend fun markAllNotificationsRead() = guard {
        api.notificationAction(NotificationActionRequest(action = "read_all"))
    }

    suspend fun sendTestNotification() = guard {
        api.notificationAction(NotificationActionRequest(action = "test"))
    }

    suspend fun sendWeeklyDigest() = guard {
        api.notificationAction(NotificationActionRequest(action = "weekly_digest"))
    }

    suspend fun fetchIntegrations(reveal: Boolean = false) = guard {
        api.getIntegrations(reveal = if (reveal) 1 else null)
    }

    suspend fun rotateApiKey() = guard {
        api.integrationKeyAction(IntegrationKeyActionRequest(action = "rotate"))
    }

    suspend fun updateIntegrationConfig(label: String?, webhookUrl: String?) = guard {
        api.integrationKeyAction(
            IntegrationKeyActionRequest(
                action = "update",
                label = label?.trim()?.takeIf { it.length >= 2 },
                webhookUrl = webhookUrl?.trim(),
            ),
        )
    }
}
