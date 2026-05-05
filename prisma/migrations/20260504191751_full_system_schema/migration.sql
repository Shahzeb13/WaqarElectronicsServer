/*
  Warnings:

  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_hash` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('CASH', 'INSTALLMENT');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "password",
DROP COLUMN "updatedAt",
ADD COLUMN     "branch_id" UUID,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "password_hash" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "manager_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_items" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "purchase_price" DECIMAL(10,2) NOT NULL,
    "sale_price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_history" (
    "id" UUID NOT NULL,
    "stock_item_id" UUID NOT NULL,
    "quantity_added" INTEGER NOT NULL,
    "supplier" TEXT,
    "added_by" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "sub_category" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "receipt_url" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_frequency" TEXT,
    "added_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cnic" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "credit_score" INTEGER,
    "is_blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "sale_type" "SaleType" NOT NULL,
    "sale_price" DECIMAL(10,2) NOT NULL,
    "installment_months" INTEGER,
    "monthly_amount" DECIMAL(10,2),
    "down_payment" DECIMAL(10,2),
    "sold_by" UUID NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installments" (
    "id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_date" TIMESTAMP(3),
    "collected_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" UUID NOT NULL,
    "sale_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "issue_description" TEXT NOT NULL,
    "claim_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assigned_to" UUID,
    "reported_resolution_date" TIMESTAMP(3),
    "resolution_date" TIMESTAMP(3),
    "resolved_by" UUID,
    "resolution_notes" TEXT,
    "resolution_cost" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery" (
    "id" UUID NOT NULL,
    "installment_id" UUID,
    "sale_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "collection_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_manager_id_key" ON "branches"("manager_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_cnic_key" ON "customers"("cnic");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_history" ADD CONSTRAINT "stock_history_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_history" ADD CONSTRAINT "stock_history_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_sold_by_fkey" FOREIGN KEY ("sold_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_collected_by_fkey" FOREIGN KEY ("collected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery" ADD CONSTRAINT "recovery_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "installments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery" ADD CONSTRAINT "recovery_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery" ADD CONSTRAINT "recovery_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery" ADD CONSTRAINT "recovery_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery" ADD CONSTRAINT "recovery_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
