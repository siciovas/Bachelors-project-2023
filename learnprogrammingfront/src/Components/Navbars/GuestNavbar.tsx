import { ReactElement } from "react";
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Link,
  IconButton,
  Button,
  Menu,
  useDisclosure,
  useColorMode,
  SimpleGrid,
  Stack,
} from "@chakra-ui/react";

interface LinksProps {
  title: string;
  url: string;
}

const LinksGuest: LinksProps[] = [
  { title: "El. Parduotuvė", url: "/parduotuve" },
];

const NavLink = ({ title, url }: LinksProps): ReactElement<LinksProps> => (
  <Link px={2} py={1} rounded={"md"} href={url}>
    {title}
  </Link>
);

const GuestNavbar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      px={4}
      width={"100%"}
      backgroundColor={location.pathname === "/" ? "none" : "#98aad0"}
      zIndex={1}
      position={location.pathname === "/" ? "absolute" : "relative"}
    >
      <SimpleGrid
        className="navbar-container"
        columns={3}
        h={14}
        alignItems="center"
      >
        <IconButton
          size={"md"}
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label={"Open Menu"}
          display={{ md: "none" }}
          onClick={isOpen ? onClose : onOpen}
        />
        <Flex>
          <Button
            justifyContent="flex-start"
            color={"white"}
            background={"none"}
            fontWeight={"normal"}
            onClick={() => navigate("/")}
            cursor={"pointer"}
            zIndex={1}
            _hover={{
              bg: "none",
            }}
          >
            Pagrindinis
          </Button>
        </Flex>
        <Flex justifyContent="center" display={{ base: "none", md: "flex" }}>
          {LinksGuest.map((link) => (
            <Button
              background={"none"}
              fontWeight={"normal"}
              onClick={() => navigate(link.url)}
              color={"white"}
              _hover={{
                bg: "none",
              }}
            >
              {link.title}
            </Button>
          ))}
        </Flex>
        <Flex justifyContent="flex-end" alignItems={"center"} gap={2}>
          <Menu>
            <Box color={"white"}>Naudojatės svečio prieiga</Box>
            <Button
              background={"none"}
              fontWeight={"normal"}
              onClick={() => navigate("/prisijungimas")}
              color={"white"}
              _hover={{
                bg: "none",
              }}
            >
              Prisijungti
            </Button>
          </Menu>
        </Flex>
      </SimpleGrid>
      {isOpen ? (
        <Box pb={4} display={{ md: "none" }}>
          <Stack as={"nav"} spacing={4}>
            {LinksGuest.map((link) => (
              <NavLink title={link.title} url={link.url} />
            ))}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
};

export { GuestNavbar };
