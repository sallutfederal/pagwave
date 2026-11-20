package com.pagwave.android.core.network

import android.content.Context
import com.pagwave.android.BuildConfig
import com.pagwave.android.core.model.*
import kotlinx.serialization.json.Json
import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

interface PagwaveApi {
    // ── Auth ─────────────────────────────────────────────────────────────
    @POST("api/auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @POST("api/auth/register")
    suspend fun register(@Body body: RegisterRequest): BasicOkResponse

    @POST("api/auth/forgot-password")
    suspend fun forgotPassword(@Body body: ForgotPasswordRequest): BasicOkResponse

    @POST("api/auth/logout")
    suspend fun logout(): BasicOkResponse

    @POST("api/auth/refresh")
    suspend fun refresh(): BasicOkResponse

    @POST("api/auth/locale")
    suspend fun updateLocale(@Body body: LocaleRequest): BasicOkResponse

    @GET("api/auth/profile")
    suspend fun getProfile(): ProfileResponse

    @PATCH("api/auth/profile")
    suspend fun patchProfile(@Body body: ProfilePatchRequest): BasicOkResponse

    @POST("api/auth/security")
    suspend fun securityAction(@Body body: SecurityActionRequest): BasicOkResponse

    @POST("api/auth/security")
    suspend fun setupTwoFactor(@Body body: SecurityActionRequest): TwoFactorSetupResponse

    @GET("api/auth/kyc")
    suspend fun getKycStatus(): KycStatusResponse

    @Multipart
    @POST("api/auth/kyc")
    suspend fun uploadKyc(
        @Part("type") type: RequestBody,
        @Part file: MultipartBody.Part,
        @Part("documentNumber") documentNumber: RequestBody? = null,
    ): KycUploadResponse

    // ── Dashboard ────────────────────────────────────────────────────────
    @GET("api/dashboard/summary")
    suspend fun getDashboardSummary(): DashboardSummaryResponse

    @GET("api/dashboard/statistic")
    suspend fun getStatistic(@Query("period") period: String = "this-month"): StatisticResponse

    @GET("api/dashboard/sales")
    suspend fun getRecentSales(): RecentSalesResponse

    @GET("api/dashboard/transactions")
    suspend fun getDashboardTransactions(@Query("limit") limit: Int = 100): TransactionsResponse

    // ── Wallet & Money Movement ──────────────────────────────────────────
    @GET("api/wallet/balance")
    suspend fun getWalletBalances(): WalletBalanceResponse

    @POST("api/wallet/cashin")
    suspend fun createCashin(@Body body: CashinRequest): CashinResponse

    @POST("api/wallet/sandbox/simulate")
    suspend fun simulateSandbox(@Body body: SandboxSimulateRequest): SandboxSimulateResponse

    @POST("api/wallet/transfer")
    suspend fun createTransfer(@Body body: TransferRequest): TransferResponse

    @POST("api/wallet/conversion")
    suspend fun conversion(@Body body: ConversionRequest): ConversionResponse

    @POST("api/wallet/cashout")
    suspend fun createCashout(@Body body: CashoutRequest): CashoutResponse

    @GET("api/wallet/beneficiaries")
    suspend fun getBeneficiaries(): BeneficiariesResponse

    @POST("api/wallet/beneficiaries")
    suspend fun createBeneficiary(@Body body: CreateBeneficiaryRequest): BasicOkResponse

    @DELETE("api/wallet/beneficiaries/{id}")
    suspend fun deleteBeneficiary(@Path("id") id: String): BasicOkResponse

    // ── Notifications ────────────────────────────────────────────────────
    @GET("api/notifications")
    suspend fun getNotifications(): NotificationsResponse

    @POST("api/notifications")
    suspend fun notificationAction(@Body body: NotificationActionRequest): BasicOkResponse

    // ── Integrations ─────────────────────────────────────────────────────
    @GET("api/integrations/keys")
    suspend fun getIntegrations(@Query("reveal") reveal: Int? = null): IntegrationsResponse

    @POST("api/integrations/keys")
    suspend fun integrationKeyAction(@Body body: IntegrationKeyActionRequest): IntegrationKeyActionResponse
}

private class TokenRefreshAuthenticator(
    private val baseUrl: String,
    private val cookieJar: PersistentCookieJar,
    private val onSessionInvalidated: () -> Unit,
) : Authenticator {
    private val lock = Any()

    override fun authenticate(route: Route?, response: Response): Request? {
        val path = response.request.url.encodedPath
        if (path.endsWith("/api/auth/login") ||
            path.endsWith("/api/auth/register") ||
            path.endsWith("/api/auth/refresh")
        ) {
            return null
        }

        if (response.priorResponse != null) {
            cookieJar.clear()
            onSessionInvalidated()
            return null
        }

        synchronized(lock) {
            val refreshClient = OkHttpClient.Builder()
                .cookieJar(cookieJar)
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .build()

            val refreshReq = Request.Builder()
                .url("${baseUrl.trimEnd('/')}/api/auth/refresh")
                .post("{}".toRequestBody("application/json".toMediaType()))
                .build()

            val refreshed = runCatching {
                refreshClient.newCall(refreshReq).execute().use { it.isSuccessful }
            }.getOrDefault(false)

            if (!refreshed) {
                cookieJar.clear()
                onSessionInvalidated()
                return null
            }

            return response.request.newBuilder()
                .header("X-Pagwave-Mobile-Retry", "1")
                .build()
        }
    }
}

class PagwaveApiClient(context: Context) {
    val cookieJar = PersistentCookieJar(context)

    @Volatile
    var onSessionExpired: (() -> Unit)? = null

    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        explicitNulls = false
    }

    private val baseUrl = BuildConfig.PAGWAVE_BASE_URL.trimEnd('/') + "/"

    private val okHttp: OkHttpClient = OkHttpClient.Builder()
        .cookieJar(cookieJar)
        .authenticator(
            TokenRefreshAuthenticator(baseUrl, cookieJar) {
                onSessionExpired?.invoke()
            },
        )
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(25, TimeUnit.SECONDS)
        .writeTimeout(25, TimeUnit.SECONDS)
        .apply {
            if (BuildConfig.DEBUG) {
                addInterceptor(HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BASIC
                })
            }
        }
        .build()

    val api: PagwaveApi = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(okHttp)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()
        .create(PagwaveApi::class.java)
}
