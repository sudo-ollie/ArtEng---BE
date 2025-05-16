-- CreateTable
CREATE TABLE "audit_log" (
    "guid" TEXT NOT NULL,
    "LogDT" TIMESTAMP(3) NOT NULL,
    "log_message" TEXT NOT NULL,
    "action_type" INTEGER NOT NULL,
    "account" TEXT NOT NULL,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("guid")
);

-- CreateTable
CREATE TABLE "events" (
    "Id" TEXT NOT NULL,
    "event_title" TEXT NOT NULL,
    "event_subtitle" TEXT,
    "event_description" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "event_location" TEXT NOT NULL,
    "event_cap" INTEGER NOT NULL,
    "event_price" INTEGER NOT NULL,
    "event_sponsor" TEXT NOT NULL,
    "event_banner" TEXT NOT NULL,
    "event_thumb" TEXT NOT NULL,
    "event_spon_logo" TEXT NOT NULL,
    "event_pub_DT" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "mailing_list" (
    "Id" TEXT NOT NULL,
    "register_time" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "mailing_list_pkey" PRIMARY KEY ("Id")
);
