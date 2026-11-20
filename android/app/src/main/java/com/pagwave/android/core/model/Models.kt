package com.pagwave.android.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import java.text.NumberFormat
import java.util.Locale

// ─── Shared Error ───────────────────────────────────────────────────────────

@Serializable
data class ApiErrorResponse(
    val error: String? = null,
    val message: String? = null,
)

// ─── Auth ───────────────────────────────────────────────────────────────────

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
    val twoFactorCode: String? = null,
)

@Serializable
data class LoginResponse(
    val ok: Boolean = false,
    val requiresTwoFactor: Boolean = false,
    val error: String? = null,
    val message: String? = null,
)

@Serializable
data class RegisterRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val password: String,
    val accountType: String = "PERSONAL",
    val companyName: String? = null,
)

@Serializable
data class ForgotPasswordRequest(val email: String)

@Serializable
data class LocaleRequest(val locale: String)

@Serializable
data class BasicOkResponse(
    val ok: Boolean = false,
    val message: String? = null,
    val locale: String? = null,
)

// ─── Profile, Preferences & Security ────────────────────────────────────────

@Serializable
data class UserProfileDto(
    val firstName: String? = null,
    val lastName: String? = null,
    val displayName: String? = null,
    val phone: String? = null,
    val country: String? = null,
    val companyName: String? = null,
    val companyTaxId: String? = null,
    val kycStatus: String? = null,
    val kycLevel: Int? = null,
)

@Serializable
data class NotificationPreferencesDto(
    val paymentAlerts: Boolean = true,
    val weeklyDigest: Boolean = true,
    val productRenewals: Boolean = false,
    val securityNotices: Boolean = true,
)

@Serializable
data class ProfileResponse(
    val ok: Boolean = false,
    val email: String = "",
    val profile: UserProfileDto? = null,
    val preferences: NotificationPreferencesDto? = null,
)

@Serializable
data class ProfilePatchRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val displayName: String? = null,
    val phone: String? = null,
    val country: String? = null,
    val companyName: String? = null,
    val companyTaxId: String? = null,
    val preferences: NotificationPreferencesDto? = null,
)

@Serializable
data class SecurityActionRequest(
    val action: String,
    val currentPassword: String? = null,
    val newPassword: String? = null,
    val code: String? = null,
    val password: String? = null,
)

@Serializable
data class TwoFactorSetupResponse(
    val secret: String? = null,
    val otpauthUrl: String? = null,
    val qrDataUrl: String? = null,
    val message: String? = null,
)

// ─── Dashboard ──────────────────────────────────────────────────────────────

@Serializable
data class AvatarDto(
    val url: String = "",
    val initials: String = "PW",
)

@Serializable
data class GreetingDto(
    val name: String = "",
    val email: String = "",
    val title: String = "",
    val subtitle: String = "",
    val avatar: AvatarDto = AvatarDto(),
    val accountLabel: String = "",
)

@Serializable
data class QuickActionDto(
    val id: String,
    val label: String,
    val active: Boolean = false,
)

@Serializable
data class DashboardSummaryResponse(
    val greeting: GreetingDto = GreetingDto(),
    val quickActions: List<QuickActionDto> = emptyList(),
)

@Serializable
data class StatisticSegmentDto(
    val id: String,
    val label: String,
    val value: Double,
    val degrees: Double,
)

@Serializable
data class StatisticResponse(
    val total: Double = 0.0,
    val currency: String = "USD",
    val period: String = "this-month",
    val label: String = "",
    val segments: List<StatisticSegmentDto> = emptyList(),
)

@Serializable
data class SaleCustomerDto(
    val name: String = "",
    val email: String = "",
    val avatar: AvatarDto = AvatarDto(),
)

@Serializable
data class SaleDto(
    val id: String,
    val customer: SaleCustomerDto,
    val date: String,
    val status: String,
    val amount: Double,
    val currency: String,
)

@Serializable
data class RecentSalesResponse(
    val sales: List<SaleDto> = emptyList(),
)

@Serializable
data class TransactionDto(
    val id: String,
    val title: String,
    val subtitle: String,
    val avatar: AvatarDto = AvatarDto(),
    val amount: Double,
    val currency: String,
    val usdAmount: Double? = null,
    val date: String,
    val category: String,
    val method: String,
    val status: String,
    val direction: String,
)

@Serializable
data class TransactionsResponse(
    val transactions: List<TransactionDto> = emptyList(),
)

// ─── Wallets, Cash-in, Cash-out, Transfer, Conversion ───────────────────────

@Serializable
data class CurrencyBalanceDto(
    val available: Double = 0.0,
    val blocked: Double = 0.0,
)

@Serializable
data class WalletBalanceResponse(
    val ok: Boolean = false,
    val isSandbox: Boolean = false,
    val balances: Map<String, CurrencyBalanceDto> = emptyMap(),
    @SerialName("blocked_currencies")
    val blockedCurrencies: List<String> = emptyList(),
    val kycLevel: Int = 0,
    val kycStatus: String = "NONE",
    @SerialName("updated_at")
    val updatedAt: String = "",
)

@Serializable
data class CashinRequest(
    val purpose: String = "self_deposit",
    val currency: String,
    val method: String? = null,
    val mode: String = "dynamic",
    val amount: Double? = null,
    val description: String? = null,
    val payer: Map<String, String> = emptyMap(),
)

@Serializable
data class CashinResponse(
    val ok: Boolean = false,
    val externalId: String = "",
    val mode: String = "dynamic",
    val purpose: String = "self_deposit",
    val result: JsonObject = JsonObject(emptyMap()),
)

@Serializable
data class TransferRequest(
    val currency: String,
    val recipientEmail: String,
    val amount: Double,
    val description: String? = null,
)

@Serializable
data class TransferReceiptDto(
    val referenceId: String = "",
    val amount: String = "0",
    val fee: String = "0",
    val netAmount: String = "0",
    val currencyCode: String = "",
    val recipientEmail: String = "",
    val recipientName: String = "",
    val status: String = "",
)

@Serializable
data class TransferResponse(
    val ok: Boolean = false,
    val transfer: TransferReceiptDto? = null,
)

@Serializable
data class ConversionRequest(
    val action: String, // "simulate" | "execute"
    val from: String,
    val to: String,
    val amount: Double,
)

@Serializable
data class ConversionResponse(
    val ok: Boolean = false,
    val simulation: JsonObject? = null,
    val conversion: JsonObject? = null,
    val balances: Map<String, CurrencyBalanceDto>? = null,
)

@Serializable
data class BeneficiaryDto(
    val id: String,
    val label: String,
    val currency: String,
    val rail: String,
    val summary: String,
    val details: Map<String, String> = emptyMap(),
    val isDefault: Boolean = false,
)

@Serializable
data class BeneficiariesResponse(
    val ok: Boolean = false,
    val beneficiaries: List<BeneficiaryDto> = emptyList(),
)

@Serializable
data class CreateBeneficiaryRequest(
    val label: String,
    val currency: String,
    val rail: String,
    val details: Map<String, String>,
    val isDefault: Boolean = false,
)

@Serializable
data class CashoutRequest(
    val beneficiaryId: String? = null,
    val currency: String? = null,
    val rail: String? = null,
    val details: Map<String, String>? = null,
    val amount: Double,
    val description: String? = null,
)

@Serializable
data class CashoutResponse(
    val ok: Boolean = false,
    val externalId: String = "",
    val result: JsonObject? = null,
)

// ─── Notifications ──────────────────────────────────────────────────────────

@Serializable
data class NotificationItemDto(
    val id: String,
    val type: String,
    val channel: String = "IN_APP",
    val title: String,
    val body: String,
    val data: JsonElement? = null,
    val isRead: Boolean = false,
    val createdAt: String,
)

@Serializable
data class NotificationsResponse(
    val ok: Boolean = false,
    val unreadCount: Int = 0,
    val notifications: List<NotificationItemDto> = emptyList(),
)

@Serializable
data class NotificationActionRequest(
    val action: String, // "read" | "read_all" | "test" | "weekly_digest"
    val id: String? = null,
)

// ─── Integrations / API Keys ────────────────────────────────────────────────

@Serializable
data class ApiCredentialDto(
    val id: String = "",
    val label: String = "",
    val clientId: String = "",
    val secretPreview: String = "",
    val webhookUrl: String = "",
    val requestCount: Int = 0,
    val lastUsedAt: String? = null,
)

@Serializable
data class ApiLogDto(
    val id: String = "",
    val method: String = "",
    val endpoint: String = "",
    val currency: String? = null,
    val statusCode: Int = 200,
    val ok: Boolean = true,
    val latencyMs: Int = 0,
    val createdAt: String = "",
)

@Serializable
data class IntegrationsResponse(
    val ok: Boolean = false,
    val isSandbox: Boolean = true,
    val credential: ApiCredentialDto? = null,
    val logs: List<ApiLogDto> = emptyList(),
)

// ─── Currency Metadata & Formatting ─────────────────────────────────────────

data class CurrencySpec(
    val code: String,
    val symbol: String,
    val name: String,
    val cashinMethod: String,
    val cashoutRail: String,
    val cashoutFieldKey: String,
    val cashoutFieldLabel: String,
    val cashoutPlaceholder: String,
    val convertible: Boolean = true,
    val integerOnly: Boolean = false,
)

object CurrenciesCatalog {
    val walletCurrencies = listOf("BRL", "USD", "USDT", "MXN", "COP", "ARS", "BOB", "CLP", "VES", "USDC")

    val specs: Map<String, CurrencySpec> = mapOf(
        "BRL" to CurrencySpec("BRL", "R$", "Real Brasileiro", "PIX", "PIX", "pix_key", "Chave Pix", "CPF, CNPJ, e-mail, +55..."),
        "USD" to CurrencySpec("USD", "$", "US Dollar", "WIRE", "WIRE", "account_number", "Account / Routing", "Número da conta USD"),
        "EUR" to CurrencySpec("EUR", "€", "Euro", "SEPA", "SEPA", "iban", "IBAN", "DE89 3704 0044 ..."),
        "MXN" to CurrencySpec("MXN", "MX$", "Peso Mexicano", "SPEI", "CLABE", "clabe", "CLABE (18 dígitos)", "646180..."),
        "COP" to CurrencySpec("COP", "COP$", "Peso Colombiano", "PSE", "BANK", "account_number", "Conta bancária", "Número da conta"),
        "ARS" to CurrencySpec("ARS", "ARS$", "Peso Argentino", "BANK", "CBU", "cbu", "CBU / CVU / Alias", "22 dígitos CBU/CVU"),
        "BOB" to CurrencySpec("BOB", "Bs", "Boliviano", "QR", "BANK", "account_number", "Conta / Banco", "Número da conta"),
        "CLP" to CurrencySpec("CLP", "CLP$", "Peso Chileno", "KHIPU", "BANK", "account_number", "Conta / RUT", "Conta bancária", integerOnly = true),
        "VES" to CurrencySpec("VES", "Bs.S", "Bolívar", "PAGO_MOVIL", "PAGO_MOVIL", "phone", "Telefone Pago Móvil", "0412..."),
        "USDT" to CurrencySpec("USDT", "USDT", "Tether USD", "TRON", "TRON", "address", "Carteira TRON (TRC-20)", "T..."),
        "USDC" to CurrencySpec("USDC", "USDC", "USD Coin", "SOLANA", "SOLANA", "address", "Carteira Solana", "Endereço Solana", convertible = false),
    )

    fun spec(code: String): CurrencySpec =
        specs[code.uppercase()] ?: CurrencySpec(code, code, code, "BANK", "BANK", "destination", "Destino", "Destino")

    fun format(amount: Double, currency: String, signed: Boolean = false): String {
        val sp = spec(currency)
        val absVal = kotlin.math.abs(amount)
        val nf = NumberFormat.getNumberInstance(Locale("pt", "BR")).apply {
            minimumFractionDigits = if (sp.integerOnly) 0 else 2
            maximumFractionDigits = if (sp.integerOnly) 0 else if (currency == "USDT" || currency == "USDC") 4 else 2
        }
        val sign = when {
            amount < 0 -> "-"
            signed && amount > 0 -> "+"
            else -> ""
        }
        return "$sign${sp.symbol} ${nf.format(absVal)}"
    }
}
