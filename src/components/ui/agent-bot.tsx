"use client";

/**
 * AI Agent Bot — Canvas animasyonu
 * - Masada oturan karakter
 * - İdle: hafif nefes animasyonu
 * - Working: monitörde yazı tipiyor, rastgele hareket
 * - CSS animasyonları ile — canvas gereksiz
 */

import { Box, Flex, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

type BotState = "idle" | "working" | "thinking";

interface AgentBotProps {
  state?: BotState;
  size?: number;
}

const MESSAGES_WORKING = [
  "Senaryo yazılıyor…",
  "Assertion türetiliyor…",
  "Şema analiz ediliyor…",
  "Belgeler okunuyor…",
  "Köprü kurgulanıyor…",
];

const MESSAGES_THINKING = [
  "Düşünüyor…",
  "Veriler inceleniyor…",
  "Hipotezler test ediliyor…",
];

/* Modül seviyesinde sabit tutulur: render sırasında yeni dizi/nesne üretmek effect
 * bağımlılıklarını her render'da değiştirir ve zamanlayıcıyı gereksiz yere yeniden kurar. */
const NO_MESSAGES: readonly string[] = [];
const EYE_CENTER: { x: number; y: number } = { x: 0, y: 0 };

/* Kol salınımı: 20 adımlık üçgen dalga, genlik ±6 derece. Adım sayacından saf olarak
 * türetilir; böylece yön değişkeni bir state güncelleyicisi içinde mutasyona uğramaz. */
const ARM_SWING_PERIOD = 20;

function armSwingAt(step: number): number {
  // +5'lik faz kaymasi salinimi orijinaldeki gibi 0 dereceden baslatir.
  const phase = (step + 5) % ARM_SWING_PERIOD;
  return phase <= 10 ? -6 + phase * 1.2 : 6 - (phase - 10) * 1.2;
}

export function AgentBot({ state = "idle", size = 120 }: AgentBotProps) {
  /* Üç animasyon da render sırasında türetilir. Effect'ler yalnız zamanlayıcıyı kurar ve
   * sayaç ilerletir; hiçbiri effect gövdesinde senkron setState çağırmaz, çünkü bu React
   * 19'da zincirleme render tetikler (react-hooks/set-state-in-effect). */
  const [messageTick, setMessageTick] = useState(0);
  const [eyeDrift, setEyeDrift] = useState(EYE_CENTER);
  const [armStep, setArmStep] = useState(0);

  const messages = state === "working"
    ? MESSAGES_WORKING
    : state === "thinking" ? MESSAGES_THINKING : NO_MESSAGES;
  const msg = messages.length === 0 ? "" : messages[messageTick % messages.length];
  const eyePos = state === "working" ? eyeDrift : EYE_CENTER;
  const armOffset = state === "working" ? armSwingAt(armStep) : 0;

  // Mesaj döngüsü — sayacı ilerletir, gösterilecek metin render sırasında seçilir.
  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setInterval(() => setMessageTick((tick) => tick + 1), 2200);
    return () => clearInterval(timer);
  }, [messages.length]);

  // Gözlerin rastgele hareketi — yalnız çalışırken sürer, durunca merkeze türetilir.
  useEffect(() => {
    if (state !== "working") return;
    const timer = setInterval(() => {
      setEyeDrift({
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 2,
      });
    }, 600);
    return () => clearInterval(timer);
  }, [state]);

  // Kol animasyonu (yazı yazıyormuş gibi) — yalnız adım sayacını ilerletir.
  useEffect(() => {
    if (state !== "working") return;
    const timer = setInterval(() => setArmStep((step) => step + 1), 80);
    return () => clearInterval(timer);
  }, [state]);

  const scale = size / 120;

  return (
    <Flex align="center" direction="column" gap="3" userSelect="none">
      <Box position="relative" style={{ transform: `scale(${scale})`, transformOrigin: "center bottom" }}>
        {/* Masa */}
        <Box
          bg="line.subtle"
          borderRadius="3px"
          h="8px"
          left="-20px"
          position="absolute"
          style={{ bottom: "12px" }}
          w="160px"
        />

        {/* Monitör */}
        <Box
          bg="app.rail"
          borderRadius="6px"
          h="38px"
          left="18px"
          overflow="hidden"
          position="absolute"
          style={{ bottom: "26px" }}
          w="52px"
        >
          {/* Monitör içi — kod satırları */}
          <Box p="4px">
            {[0.9, 0.6, 0.8, 0.4].map((opacity, i) => (
              <Box
                key={i}
                bg="accent.soft"
                borderRadius="2px"
                h="4px"
                mb="3px"
                style={{
                  opacity,
                  width: `${30 + i * 4}px`,
                  animation: state === "working" ? `ptn-code-blink ${1.2 + i * 0.3}s ease-in-out infinite alternate` : "none",
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Klavye */}
        <Box
          bg="app.muted"
          border="1px solid"
          borderColor="line.subtle"
          borderRadius="4px"
          h="10px"
          left="22px"
          position="absolute"
          style={{ bottom: "18px" }}
          w="44px"
        />

        {/* Gövde */}
        <Flex
          align="center"
          bg="accent.solid"
          borderRadius="16px"
          direction="column"
          h="62px"
          justify="flex-end"
          pb="4px"
          position="relative"
          style={{
            animation: state === "idle" ? "ptn-breathe 3s ease-in-out infinite" : "none",
          }}
          w="52px"
        >
          {/* Baş */}
          <Box
            bg="accent.solid"
            borderRadius="14px"
            h="38px"
            left="50%"
            position="absolute"
            style={{ top: "-32px", transform: "translateX(-50%)" }}
            w="42px"
          >
            {/* Yüz ekranı */}
            <Box
              bg="app.rail"
              borderRadius="8px"
              h="26px"
              left="6px"
              overflow="hidden"
              position="absolute"
              style={{ top: "6px" }}
              w="30px"
            >
              {/* Gözler */}
              <Flex align="center" h="full" justify="center" gap="6px">
                {[0, 1].map((i) => (
                  <Box
                    bg={state === "idle" ? "accent.soft" : "state.successSoft"}
                    borderRadius="full"
                    h="7px"
                    key={i}
                    style={{
                      transform: `translate(${eyePos.x}px, ${eyePos.y}px)`,
                      transition: "transform 200ms ease-out",
                    }}
                    w="7px"
                  />
                ))}
              </Flex>
            </Box>
          </Box>

          {/* Terminal işareti */}
          <Text color="white" fontSize="10px" fontWeight="800" opacity={0.8}>
            {state === "working" ? "⌨" : ">_"}
          </Text>
        </Flex>

        {/* Sol kol */}
        <Box
          bg="accent.solid"
          borderRadius="4px"
          h="22px"
          position="absolute"
          style={{
            bottom: "28px",
            left: "-10px",
            transform: `rotate(${state === "working" ? -20 + armOffset : -15}deg)`,
            transformOrigin: "top right",
            transition: "transform 80ms linear",
          }}
          w="14px"
        />

        {/* Sağ kol — klavyede */}
        <Box
          bg="accent.solid"
          borderRadius="4px"
          h="22px"
          position="absolute"
          style={{
            bottom: "28px",
            right: "-10px",
            transform: `rotate(${state === "working" ? 20 - armOffset : 15}deg)`,
            transformOrigin: "top left",
            transition: "transform 80ms linear",
          }}
          w="14px"
        />

        {/* Bacaklar */}
        <Flex gap="6px" justify="center" position="absolute" style={{ bottom: "12px" }} w="52px">
          {[0, 1].map((i) => (
            <Box bg="accent.soft" borderRadius="4px" h="14px" key={i} w="12px" />
          ))}
        </Flex>
      </Box>

      {/* Mesaj balonu */}
      {msg && (
        <Box
          bg="app.surface"
          border="1px solid"
          borderColor="line.subtle"
          borderRadius="control"
          boxShadow="0 2px 12px rgba(0,0,0,0.06)"
          maxW="200px"
          px="3"
          py="1.5"
          style={{ animation: "ptn-msg-fade 300ms ease-out both" }}
          textAlign="center"
        >
          <Text color="ink.muted" fontSize="11px" fontWeight="500">{msg}</Text>
        </Box>
      )}
    </Flex>
  );
}
