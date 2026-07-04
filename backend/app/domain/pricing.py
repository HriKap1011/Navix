from dataclasses import dataclass

@dataclass(frozen=True)
class Money:
    amount: float
    currency: str = "INR"

@dataclass
class Pricing:
    base_price: Money
    total_price: Money
