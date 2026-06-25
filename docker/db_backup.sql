--
-- PostgreSQL database dump
--

\restrict GVK6VxojlmQxAghbL2oJeSqOB15ehvVChGhgXwphLQmUAUdxPsKIv7oD3R4w276

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: tvdlog
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    user_id integer,
    username character varying(50),
    action character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer,
    ip_address character varying(45),
    details character varying
);


ALTER TABLE public.audit_logs OWNER TO tvdlog;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: tvdlog
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_logs_id_seq OWNER TO tvdlog;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tvdlog
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: tvdlog
--

CREATE TABLE public.media (
    id integer NOT NULL,
    filename character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    type character varying(20) NOT NULL,
    duration integer,
    active boolean,
    "order" integer NOT NULL,
    uploaded_at timestamp without time zone,
    url character varying(500) NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    scheduled_start timestamp without time zone
);


ALTER TABLE public.media OWNER TO tvdlog;

--
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: tvdlog
--

CREATE SEQUENCE public.media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.media_id_seq OWNER TO tvdlog;

--
-- Name: media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tvdlog
--

ALTER SEQUENCE public.media_id_seq OWNED BY public.media.id;


--
-- Name: settings; Type: TABLE; Schema: public; Owner: tvdlog
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value character varying NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.settings OWNER TO tvdlog;

--
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: tvdlog
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.settings_id_seq OWNER TO tvdlog;

--
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tvdlog
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: tvdlog
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    must_change_password boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO tvdlog;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: tvdlog
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO tvdlog;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: tvdlog
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: tvdlog
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: media id; Type: DEFAULT; Schema: public; Owner: tvdlog
--

ALTER TABLE ONLY public.media ALTER COLUMN id SET DEFAULT nextval('public.media_id_seq'::regclass);


--
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: tvdlog
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: tvdlog
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: tvdlog
--

COPY public.audit_logs (id, "timestamp", user_id, username, action, entity_type, entity_id, ip_address, details) FROM stdin;
1	2026-06-25 15:06:59.502232	\N	\N	CREATE_USER	User	1	\N	Usuário 'admin' criado
2	2026-06-25 15:06:59.521352	\N	\N	CREATE_SETTING	Settings	1	\N	Configuração 'news_enabled' definida para 'true'
3	2026-06-25 15:06:59.530524	\N	\N	CREATE_SETTING	Settings	2	\N	Configuração 'logo_blur_enabled' definida para 'true'
4	2026-06-25 15:06:59.538964	\N	\N	CREATE_SETTING	Settings	3	\N	Configuração 'logo_position' definida para 'top-left'
5	2026-06-25 15:06:59.548451	\N	\N	CREATE_SETTING	Settings	4	\N	Configuração 'clock_position' definida para 'top-right'
6	2026-06-25 15:06:59.555926	\N	\N	CREATE_SETTING	Settings	5	\N	Configuração 'news_position' definida para 'bottom'
7	2026-06-25 15:07:15.63355	1	admin	LOGIN_SUCCESS	User	1	172.20.0.4	Usuário 'admin' realizou login com sucesso
8	2026-06-25 15:07:29.712692	1	admin	CREATE_USER	User	2	172.20.0.4	Usuário 'teste' criado
9	2026-06-25 15:07:48.884622	1	admin	UPDATE_USER	User	2	172.20.0.4	Usuário 'teste' atualizado
10	2026-06-25 15:07:55.786057	2	teste	LOGIN_SUCCESS	User	2	172.20.0.4	Usuário 'teste' realizou login com sucesso
11	2026-06-25 15:08:04.857919	1	admin	LOGIN_SUCCESS	User	1	172.20.0.4	Usuário 'admin' realizou login com sucesso
12	2026-06-25 15:08:12.428877	1	admin	DELETE_USER	User	2	172.20.0.4	Usuário 'teste' excluído
13	2026-06-25 15:08:17.790056	1	admin	CREATE_USER	User	3	172.20.0.4	Usuário 'teste' criado
14	2026-06-25 15:08:25.859409	3	teste	LOGIN_SUCCESS	User	3	172.20.0.4	Usuário 'teste' realizou login com sucesso
15	2026-06-25 15:08:37.75588	3	teste	UPDATE_USER	User	3	172.20.0.4	Usuário 'teste' atualizado
16	2026-06-25 15:08:48.317251	\N	teste	LOGIN_FAILED	User	\N	172.20.0.4	Tentativa de login falhou para o usuário 'teste'
17	2026-06-25 15:08:53.008759	3	teste	LOGIN_SUCCESS	User	3	172.20.0.4	Usuário 'teste' realizou login com sucesso
18	2026-06-25 15:09:00.876643	1	admin	LOGIN_SUCCESS	User	1	172.20.0.4	Usuário 'admin' realizou login com sucesso
19	2026-06-25 15:09:07.384652	1	admin	UPDATE_USER	User	1	172.20.0.4	Usuário 'admin' atualizado
20	2026-06-25 15:09:14.32591	1	admin	LOGIN_SUCCESS	User	1	172.20.0.4	Usuário 'admin' realizou login com sucesso
21	2026-06-25 15:09:28.303526	1	admin	CREATE_SETTING	Settings	6	172.20.0.4	Configuração 'logo_url' definida para '/uploads/logo_5829b7ea-238c-49d4-a51d-c77ef39e2afc.png'
22	2026-06-25 15:09:31.329491	1	admin	UPDATE_SETTING	Settings	1	172.20.0.4	Configuração 'news_enabled' alterada para 'true'
23	2026-06-25 15:09:31.336657	1	admin	CREATE_SETTING	Settings	7	172.20.0.4	Configuração 'weather_enabled' definida para 'true'
24	2026-06-25 15:09:31.343466	1	admin	CREATE_SETTING	Settings	8	172.20.0.4	Configuração 'weather_city' definida para 'Brasília'
25	2026-06-25 15:09:31.348601	1	admin	CREATE_SETTING	Settings	9	172.20.0.4	Configuração 'sync_interval' definida para '15'
26	2026-06-25 15:09:31.352691	1	admin	UPDATE_SETTING	Settings	2	172.20.0.4	Configuração 'logo_blur_enabled' alterada para 'true'
27	2026-06-25 15:09:31.357462	1	admin	UPDATE_SETTING	Settings	3	172.20.0.4	Configuração 'logo_position' alterada para 'top-left'
28	2026-06-25 15:09:31.363438	1	admin	UPDATE_SETTING	Settings	4	172.20.0.4	Configuração 'clock_position' alterada para 'top-right'
29	2026-06-25 15:09:31.367675	1	admin	UPDATE_SETTING	Settings	5	172.20.0.4	Configuração 'news_position' alterada para 'bottom'
30	2026-06-25 15:09:31.740601	1	admin	UPDATE_SETTING	Settings	1	172.20.0.4	Configuração 'news_enabled' alterada para 'true'
31	2026-06-25 15:09:31.748623	1	admin	UPDATE_SETTING	Settings	7	172.20.0.4	Configuração 'weather_enabled' alterada para 'false'
32	2026-06-25 15:09:31.753757	1	admin	UPDATE_SETTING	Settings	8	172.20.0.4	Configuração 'weather_city' alterada para 'Brasília'
33	2026-06-25 15:09:31.759525	1	admin	UPDATE_SETTING	Settings	9	172.20.0.4	Configuração 'sync_interval' alterada para '15'
34	2026-06-25 15:09:31.765856	1	admin	UPDATE_SETTING	Settings	2	172.20.0.4	Configuração 'logo_blur_enabled' alterada para 'true'
35	2026-06-25 15:09:31.77072	1	admin	UPDATE_SETTING	Settings	3	172.20.0.4	Configuração 'logo_position' alterada para 'top-left'
36	2026-06-25 15:09:31.776006	1	admin	UPDATE_SETTING	Settings	4	172.20.0.4	Configuração 'clock_position' alterada para 'top-right'
37	2026-06-25 15:09:31.783688	1	admin	UPDATE_SETTING	Settings	5	172.20.0.4	Configuração 'news_position' alterada para 'bottom'
38	2026-06-25 15:09:32.644941	1	admin	UPDATE_SETTING	Settings	1	172.20.0.4	Configuração 'news_enabled' alterada para 'true'
39	2026-06-25 15:09:32.650057	1	admin	UPDATE_SETTING	Settings	7	172.20.0.4	Configuração 'weather_enabled' alterada para 'true'
40	2026-06-25 15:09:32.654487	1	admin	UPDATE_SETTING	Settings	8	172.20.0.4	Configuração 'weather_city' alterada para 'Brasília'
41	2026-06-25 15:09:32.659298	1	admin	UPDATE_SETTING	Settings	9	172.20.0.4	Configuração 'sync_interval' alterada para '15'
42	2026-06-25 15:09:32.666533	1	admin	UPDATE_SETTING	Settings	2	172.20.0.4	Configuração 'logo_blur_enabled' alterada para 'true'
43	2026-06-25 15:09:32.673742	1	admin	UPDATE_SETTING	Settings	3	172.20.0.4	Configuração 'logo_position' alterada para 'top-left'
44	2026-06-25 15:09:32.680265	1	admin	UPDATE_SETTING	Settings	4	172.20.0.4	Configuração 'clock_position' alterada para 'top-right'
45	2026-06-25 15:09:32.684162	1	admin	UPDATE_SETTING	Settings	5	172.20.0.4	Configuração 'news_position' alterada para 'bottom'
46	2026-06-25 15:09:35.188215	1	admin	UPDATE_SETTING	Settings	1	172.20.0.4	Configuração 'news_enabled' alterada para 'true'
47	2026-06-25 15:09:35.19482	1	admin	UPDATE_SETTING	Settings	7	172.20.0.4	Configuração 'weather_enabled' alterada para 'true'
48	2026-06-25 15:09:35.200651	1	admin	UPDATE_SETTING	Settings	8	172.20.0.4	Configuração 'weather_city' alterada para 'Brasília'
49	2026-06-25 15:09:35.204744	1	admin	UPDATE_SETTING	Settings	9	172.20.0.4	Configuração 'sync_interval' alterada para '15'
50	2026-06-25 15:09:35.208777	1	admin	UPDATE_SETTING	Settings	2	172.20.0.4	Configuração 'logo_blur_enabled' alterada para 'true'
51	2026-06-25 15:09:35.215056	1	admin	UPDATE_SETTING	Settings	3	172.20.0.4	Configuração 'logo_position' alterada para 'bottom-left'
52	2026-06-25 15:09:35.219246	1	admin	UPDATE_SETTING	Settings	4	172.20.0.4	Configuração 'clock_position' alterada para 'top-right'
53	2026-06-25 15:09:35.22329	1	admin	UPDATE_SETTING	Settings	5	172.20.0.4	Configuração 'news_position' alterada para 'bottom'
54	2026-06-25 15:09:36.996728	1	admin	UPDATE_SETTING	Settings	1	172.20.0.4	Configuração 'news_enabled' alterada para 'true'
55	2026-06-25 15:09:37.002465	1	admin	UPDATE_SETTING	Settings	7	172.20.0.4	Configuração 'weather_enabled' alterada para 'true'
56	2026-06-25 15:09:37.006708	1	admin	UPDATE_SETTING	Settings	8	172.20.0.4	Configuração 'weather_city' alterada para 'Brasília'
58	2026-06-25 15:09:37.017886	1	admin	UPDATE_SETTING	Settings	2	172.20.0.4	Configuração 'logo_blur_enabled' alterada para 'true'
60	2026-06-25 15:09:37.026965	1	admin	UPDATE_SETTING	Settings	4	172.20.0.4	Configuração 'clock_position' alterada para 'bottom-right'
62	2026-06-25 15:09:38.655827	1	admin	UPDATE_SETTING	Settings	1	172.20.0.4	Configuração 'news_enabled' alterada para 'true'
64	2026-06-25 15:09:38.666618	1	admin	UPDATE_SETTING	Settings	8	172.20.0.4	Configuração 'weather_city' alterada para 'Brasília'
66	2026-06-25 15:09:38.676761	1	admin	UPDATE_SETTING	Settings	2	172.20.0.4	Configuração 'logo_blur_enabled' alterada para 'true'
68	2026-06-25 15:09:38.686424	1	admin	UPDATE_SETTING	Settings	4	172.20.0.4	Configuração 'clock_position' alterada para 'bottom-right'
57	2026-06-25 15:09:37.013784	1	admin	UPDATE_SETTING	Settings	9	172.20.0.4	Configuração 'sync_interval' alterada para '15'
59	2026-06-25 15:09:37.021809	1	admin	UPDATE_SETTING	Settings	3	172.20.0.4	Configuração 'logo_position' alterada para 'bottom-left'
61	2026-06-25 15:09:37.030882	1	admin	UPDATE_SETTING	Settings	5	172.20.0.4	Configuração 'news_position' alterada para 'bottom'
63	2026-06-25 15:09:38.661279	1	admin	UPDATE_SETTING	Settings	7	172.20.0.4	Configuração 'weather_enabled' alterada para 'true'
65	2026-06-25 15:09:38.671292	1	admin	UPDATE_SETTING	Settings	9	172.20.0.4	Configuração 'sync_interval' alterada para '15'
67	2026-06-25 15:09:38.681667	1	admin	UPDATE_SETTING	Settings	3	172.20.0.4	Configuração 'logo_position' alterada para 'bottom-left'
69	2026-06-25 15:09:38.691541	1	admin	UPDATE_SETTING	Settings	5	172.20.0.4	Configuração 'news_position' alterada para 'top'
70	2026-06-25 15:09:42.613368	1	admin	UPLOAD_MEDIA	Media	1	172.20.0.4	Mídia 'ULTIMATE_EDITION_VICE_CITY_STYLE_01.jpg' (tipo: image) carregada
71	2026-06-25 15:09:46.643517	1	admin	UPLOAD_MEDIA	Media	2	172.20.0.4	Mídia 'KKKKKKKKKKKKKKKKKKKKKKk_COMPLETO_sorriso_completo.png' (tipo: image) carregada
\.


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: tvdlog
--

COPY public.media (id, filename, original_name, type, duration, active, "order", uploaded_at, url, created_at, updated_at, scheduled_start) FROM stdin;
1	abe6b8f0-4d3f-43dc-b249-178cb74b1730.jpg	ULTIMATE_EDITION_VICE_CITY_STYLE_01.jpg	image	10	t	1	2026-06-25 15:09:42.611825	/uploads/abe6b8f0-4d3f-43dc-b249-178cb74b1730.jpg	2026-06-25 15:09:42.611828	2026-06-25 15:09:42.611829	\N
2	4c18260a-5964-4bf6-901d-c70774fe6d20.png	KKKKKKKKKKKKKKKKKKKKKKk_COMPLETO_sorriso_completo.png	image	10	t	2	2026-06-25 15:09:46.641694	/uploads/4c18260a-5964-4bf6-901d-c70774fe6d20.png	2026-06-25 15:09:46.641703	2026-06-25 15:09:46.641706	\N
\.


--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: tvdlog
--

COPY public.settings (id, key, value, created_at, updated_at) FROM stdin;
1	news_enabled	true	2026-06-25 15:06:59.519134	2026-06-25 15:06:59.519142
2	logo_blur_enabled	true	2026-06-25 15:06:59.529751	2026-06-25 15:06:59.529754
6	logo_url	/uploads/logo_5829b7ea-238c-49d4-a51d-c77ef39e2afc.png	2026-06-25 15:09:28.302862	2026-06-25 15:09:28.302865
8	weather_city	Brasília	2026-06-25 15:09:31.342715	2026-06-25 15:09:31.342717
9	sync_interval	15	2026-06-25 15:09:31.348206	2026-06-25 15:09:31.348208
7	weather_enabled	true	2026-06-25 15:09:31.336006	2026-06-25 15:09:32.64936
3	logo_position	bottom-left	2026-06-25 15:06:59.537932	2026-06-25 15:09:35.214432
4	clock_position	bottom-right	2026-06-25 15:06:59.547001	2026-06-25 15:09:37.026482
5	news_position	top	2026-06-25 15:06:59.555188	2026-06-25 15:09:38.690916
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: tvdlog
--

COPY public.users (id, username, password_hash, must_change_password, created_at, updated_at) FROM stdin;
3	teste	$2b$12$8OSfwYIeq7KrwzcKJ7H9U.O7uX4wzFTTI3/rTgyhOgVXdnEB4/7V.	f	2026-06-25 15:08:17.789367	2026-06-25 15:08:37.755192
1	admin	$2b$12$7CFadEd07egxBU.ubjOyOu4mT7UfQ16NpQ68wEhncbEsAGKhw1mXW	f	2026-06-25 15:06:59.500005	2026-06-25 15:09:07.383912
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: tvdlog
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 71, true);


--
-- Name: media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: tvdlog
--

SELECT pg_catalog.setval('public.media_id_seq', 2, true);


--
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: tvdlog
--

SELECT pg_catalog.setval('public.settings_id_seq', 9, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: tvdlog
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: audit_logs pk_audit_logs; Type: CONSTRAINT; Schema: public; Owner: tvdlog
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT pk_audit_logs PRIMARY KEY (id);


--
-- Name: media pk_media; Type: CONSTRAINT; Schema: public; Owner: tvdlog
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT pk_media PRIMARY KEY (id);


--
-- Name: settings pk_settings; Type: CONSTRAINT; Schema: public; Owner: tvdlog
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT pk_settings PRIMARY KEY (id);


--
-- Name: users pk_users; Type: CONSTRAINT; Schema: public; Owner: tvdlog
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT pk_users PRIMARY KEY (id);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: tvdlog
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: tvdlog
--

CREATE INDEX ix_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp");


--
-- Name: ix_media_active; Type: INDEX; Schema: public; Owner: tvdlog
--

CREATE INDEX ix_media_active ON public.media USING btree (active);


--
-- Name: ix_media_active_order; Type: INDEX; Schema: public; Owner: tvdlog
--

CREATE INDEX ix_media_active_order ON public.media USING btree (active, "order");


--
-- Name: ix_media_id; Type: INDEX; Schema: public; Owner: tvdlog
--

CREATE INDEX ix_media_id ON public.media USING btree (id);


--
-- Name: ix_settings_id; Type: INDEX; Schema: public; Owner: tvdlog
--

CREATE INDEX ix_settings_id ON public.settings USING btree (id);


--
-- Name: ix_settings_key; Type: INDEX; Schema: public; Owner: tvdlog
--

CREATE UNIQUE INDEX ix_settings_key ON public.settings USING btree (key);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: tvdlog
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: tvdlog
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- PostgreSQL database dump complete
--

\unrestrict GVK6VxojlmQxAghbL2oJeSqOB15ehvVChGhgXwphLQmUAUdxPsKIv7oD3R4w276

