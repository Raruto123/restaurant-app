import mongoose from "mongoose";


const orderSchema = new mongoose.Schema({
    restaurant : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Restaurant",
        required : true
    },
    tableNumber : {
        type : Number,
        required : true
    },
    items : [{
        name : String,
        price : Number,
        qty : Number,
    }],
    totalAmount : {
        type : Number,
        required : true
    },
    status : {
        type : String,
        enum : ["pending", "paid"],
        default : "pending"
    },
    qrCodeId : {
        type : String,
        required : true,
        unique : true
    },
    payment_url : {
        type : String,
        default : null
    }
}, {timestamps : true}
)


export default mongoose.model("Order", orderSchema)