from pydantic import BaseModel


class InitializePaymentResponse(BaseModel):
    reference: str
    access_code: str
    authorization_url: str
    public_key: str
    amount: int  # naira, for display -- the actual charge amount Paystack uses is sent server-side in kobo


class VerifyPaymentRequest(BaseModel):
    reference: str
