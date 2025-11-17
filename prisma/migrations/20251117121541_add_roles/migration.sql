-- CreateTable
CREATE TABLE "Pitboss" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT,
    "nickname" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "promotions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pitboss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QA" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT,
    "nickname" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "promotions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Training" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT,
    "nickname" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "promotions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CroupierToGame" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CroupierToGame_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pitboss_nickname_key" ON "Pitboss"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "QA_nickname_key" ON "QA"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Training_nickname_key" ON "Training"("nickname");

-- CreateIndex
CREATE INDEX "_CroupierToGame_B_index" ON "_CroupierToGame"("B");

-- AddForeignKey
ALTER TABLE "_CroupierToGame" ADD CONSTRAINT "_CroupierToGame_A_fkey" FOREIGN KEY ("A") REFERENCES "Croupier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CroupierToGame" ADD CONSTRAINT "_CroupierToGame_B_fkey" FOREIGN KEY ("B") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
